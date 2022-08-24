from os import getenv
from typing import Any, List, Type

from flask import g
from oso_cloud import Oso
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound, Unauthorized

from app.models import Repository, Organization, Issue

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
        res = oso.authorize(actor, action, resource)
        print("Allowed" if res else "Denied")
        return res
    except Exception as e:
        print(f"error from Oso Cloud: {e} for request: allow({actor}, {action}, {resource})")


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


def get_facts_for_org(org: Organization):
    actor = current_user()
    resource = { "type": "Organization", "id": str(org.id) }
    # come from DB
    has_org_role = oso.get("has_role", actor, {}, resource)
    default_role = ["has_default_role", resource, "reader"]
    return [*has_org_role, default_role]

def get_facts_for_repo(repository: Repository):
    actor = current_user()
    resource = { "type": "Repository", "id": str(repository.id) }
    parent = { "type": "Organization", "id": str(repository.org_id) }

    # this is nice; no DB hit
    has_parent = ["has_relation", resource, "organization", parent]

    # come from DB
    has_repo_role = oso.get("has_role", actor, {}, resource)
    is_protected = ["is_protected", resource, {"type": "Boolean", "id": "false"}]

    return [has_parent, *has_repo_role, is_protected, *get_facts_for_org(repository.org)]

def get_facts_for_issue(issue: Issue):
    #  actor = current_user()
     resource = { "type": "Issue", "id": str(issue.id) }
     parent = { "type": "Repository", "id": str(issue.repo_id) }

     has_parent = ["has_relation", resource, "repository", parent]
     creator = [["has_role", {"type": "User", "id": str(issue.creator_id)}, "creator", resource]] if issue.creator_id is not None else []
     closed = [["is_closed", resource]] if issue.closed else []

     return [has_parent, *creator, *closed, *get_facts_for_repo(issue.repo)]

import functools

# Fake decorator thingy
def fact(*args):
    def decorator(fn):
        return fn
    return decorator