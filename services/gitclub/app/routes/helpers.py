from os import getenv
from typing import Any, List, Type

from flask import g
from oso_cloud import Oso
from sqlalchemy.orm.session import Session
from sqlalchemy.future import select
from werkzeug.exceptions import Forbidden, NotFound, Unauthorized

from app.models import Repository, Organization, Issue, OrgRole, RepoRole

oso = Oso(url=getenv("OSO_URL", "https://cloud.osohq.com"), api_key=getenv("OSO_AUTH"))

def object_to_typed_id(obj: Any, allow_unbound=False) -> dict:
    if isinstance(obj, str):
        return obj
    elif isinstance(obj, dict):
        assert allow_unbound or ("type" in obj and "id" in obj)
        if "type" in obj:
            obj["type"] = str(obj["type"])
        if "id" in obj:
            obj["id"] = str(obj["id"])
        return obj
    else:
        return { "type": obj.__class__.__name__, "id": str(obj.id) }

def current_user():
    if g.current_user is None:
        raise Unauthorized
    return { "type": "User", "id": g.current_user.username }

def authorize(action: str, resource: Any) -> bool:
    if g.current_user is None:
        raise Unauthorized
    actor = current_user()
    resource = object_to_typed_id(resource)
    print(f"oso-cloud authorize {actor} {action} {resource}")
    try:
        context_facts = []
        if resource["type"] == "Organization":
            context_facts = get_facts_for_org(resource["id"])
        if resource["type"] == "Repository":
            context_facts = get_facts_for_repo(resource["id"])
        if resource["type"] == "Issue":
            context_facts = get_facts_for_issue(resource["id"])
        res = oso.authorize(actor, action, resource, context_facts)
        print("Allowed" if res else "Denied")
        return res
    except Exception as e:
        print(f"error from Oso Cloud: {e} for request: allow({actor}, {action}, {resource})")

def authorized_repositories(action: str, org_id: str) -> List[str]:
    facts = get_facts_for_repo(org_id)
    repos = g.session.query(Repository).filter(Repository.org_id==org_id).all()
    for r in repos:
        facts.extend(get_facts_for_repo(r.id, False))
    actor = current_user()
    print(f"oso-cloud list {actor} {action} Repository -c {facts}")
    return oso.list(actor, action, "Repository", context_facts=facts)


def authorized_resources(action: str, resource_type: str) -> List[str]:
    if g.current_user is None:
        return []
    return oso.list({ "type": "User", "id": g.current_user.username }, action, resource_type)

def query(predicate: str, *args: Any):
    return oso.query(predicate, *[object_to_typed_id(a, True) for a in args])

def get_or_raise(self, cls: Type[Any], error, **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise error
    return resource


def get_or_403(self, cls: Type[Any], **kwargs):
    return self.get_or_raise(cls, Forbidden, **kwargs)


def get_or_404(self, cls: Type[Any], **kwargs):
    return self.get_or_raise(cls, NotFound, **kwargs)


Session.get_or_404 = get_or_404  # type: ignore
Session.get_or_403 = get_or_403  # type: ignore
Session.get_or_raise = get_or_raise  # type: ignore

# TODO: optimize these
def get_facts_for_org(org_id: int):
    actor = current_user()
    org = g.session.query(Organization).filter_by(id=org_id).one_or_none()
    if not org:
        return []
    resource = { "type": "Organization", "id": str(org_id) }
    has_org_role = list(map(lambda org_role: ["has_role", {"type": "User", "id": org_role.user_id}, org_role.role, resource], g.session.query(OrgRole).filter(OrgRole.user_id==actor["id"], OrgRole.org_id==org_id).all()))
    # TODO: this could be an org attribute too
    default_role = ["has_default_role", resource, "reader"]
    return [*has_org_role, default_role]

def get_facts_for_repo(repo_id: int, recurse=True):
    actor = current_user()
    repo = g.session.query(Repository).filter_by(id=repo_id).one_or_none()
    if not repo:
        return []
    resource = { "type": "Repository", "id": str(repo_id) }
    parent = { "type": "Organization", "id": str(repo.org_id) }

    has_parent = ["has_relation", resource, "organization", parent]
    has_repo_role = list(map(lambda repo_role: ["has_role", actor, repo_role.role, resource], g.session.query(RepoRole).filter(RepoRole.user_id==actor["id"], RepoRole.repo_id==repo_id).all()))
    is_protected = ["is_protected", resource, {"type": "Boolean", "id": str(repo.protected).lower()}]
    is_public = [["is_public", resource]] if repo.public else []

    return [has_parent, *has_repo_role, is_protected, *is_public, *(get_facts_for_org(repo.org_id) if recurse else [])]

def get_facts_for_issue(issue_id: int):
    #  actor = current_user()
     issue = g.session.query(Issue).filter_by(id=issue_id).one_or_none()
     if not issue:
        return []
     resource = { "type": "Issue", "id": str(issue_id) }
     parent = { "type": "Repository", "id": str(issue.repo_id) }

     has_parent = ["has_relation", resource, "repository", parent]
     creator = list(map(lambda issue: ["has_role", {"type": "User", "id": str(issue.creator_id)}], issue))
     closed = list(map(lambda issue: ["is_closed", {"type": "Issue", "id": str(issue.id)}], [i for i in issue if i.closed]))

     return [has_parent, *creator, *closed, *get_facts_for_repo(issue.repo)]

import functools

# Fake decorator thingy
def fact(*args):
    @functools.wraps
    def decorator(fn):
        return fn
    return decorator