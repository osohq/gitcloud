from os import getenv
from typing import Any, List, Optional, Type

from flask import g
from flask_caching import Cache
from oso_cloud import Oso
from sqlalchemy.orm.session import Session
from sqlalchemy.future import select
from werkzeug.exceptions import Forbidden, NotFound, Unauthorized

from app.models import Repository, Organization, Issue, OrgRole, RepoRole, User

oso = Oso(url=getenv("OSO_URL", "https://cloud.osohq.com"), api_key=getenv("OSO_AUTH"))
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})

def object_to_typed_id(obj: Any, allow_unbound=False) -> dict:
    if isinstance(obj, str):
        return {"type": "String", "id": obj}
    elif isinstance(obj, dict):
        assert allow_unbound or ("type" in obj and "id" in obj)
        if "type" in obj:
            obj["type"] = str(obj["type"])
        if "id" in obj:
            obj["id"] = str(obj["id"])
        return obj
    elif isinstance(obj, User):
        return { "type": "User", "id": obj.username}
    elif obj is None:
        return {}
    else:
        return { "type": obj.__class__.__name__, "id": str(obj.id) }

def current_user():
    if g.current_user is None:
        raise Unauthorized
    return object_to_typed_id(g.current_user)


def tell(predicate: str, *args: Any):
    print(f'oso-cloud tell {predicate} {",".join([str(a) for a in args])}')
    return oso.tell(predicate, *[object_to_typed_id(a, True) for a in args])

def authorize(action: str, resource: Any) -> bool:
    if g.current_user is None:
        raise Unauthorized
    actor = current_user()
    resource = object_to_typed_id(resource)
    try:
        context_facts = []
        if resource["type"] == "Issue":
            context_facts = get_facts_for_issue(None, resource["id"])
        print(f"oso-cloud authorize {actor} {action} {resource} -c \"{context_facts}\"")
        res = oso.authorize(actor, action, resource, context_facts)
        print("Allowed" if res else "Denied")
        return res
    except Exception as e:
        print(f"error from Oso Cloud: {e} for request: allow({actor}, {action}, {resource})")
        return False

def actions(resource: Any) -> List[str]:
    if g.current_user is None:
        return []
    actor = current_user()
    resource = object_to_typed_id(resource)
    context_facts = []
    try:
        if resource["type"] == "Issue":
            context_facts = get_facts_for_issue(None, resource["id"])
        print(f"oso-cloud actions {actor} {resource} -c \"{context_facts}\"")
        res = oso.actions(actor, resource, context_facts=context_facts)
        print(res)
        return res
    except Exception as e:
        print(f"error from Oso Cloud: {e} for request: allow({actor}, _, {resource}) -c {context_facts}")


def authorized_resources(action: str, resource_type: str, parent: Optional[str] = None) -> List[str]:
    facts = []
    if g.current_user is None:
        return []
    if resource_type == "Issue":
        if not parent:
            raise Exception("cannot get issues without a parent repository")
        facts = get_facts_for_issue(parent, None)
    print(f"oso-cloud list User:{g.current_user.username} {action} {resource_type} -c \"{facts}\"")
    return oso.list({ "type": "User", "id": g.current_user.username }, action, resource_type, context_facts=facts)

def query(predicate: str, *args: Any):
    print(f'oso-cloud query {predicate} {",".join([str(a) for a in args])}')
    return oso.query(predicate, *[object_to_typed_id(a, True) for a in args])

def get(predicate: str, *args: Any):
    print(f'oso-cloud get {predicate} {",".join([str(a) for a in args])}')
    return oso.get(predicate, *[object_to_typed_id(a, True) for a in args])


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

def get_facts_for_issue(repo_id: Optional[int], issue_id: Optional[int]):
    if repo_id is None and issue_id is None:
        raise Exception("need to get issues by at least one of repo_id or issue_id")
    query = g.session.query(Issue)
    if repo_id:
        query = query.filter_by(repo_id=repo_id)
    if issue_id:
        query = query.filter_by(id=issue_id)

    issues = query.all()
    facts = []

    for issue in issues:
        parent = { "type": "Repository", "id": str(issue.repo_id) }
        resource = { "type": "Issue", "id": str(issue.id) }
        
        has_parent = ["has_relation", resource, "repository", parent]
        creator = ["has_role", {"type": "User", "id": str(issue.creator_id)}, "creator", resource]
        closed = [["is_closed", resource]] if issue.closed else []
        facts.extend([has_parent, creator, *closed])

    return facts
