from os import getenv
from typing import Any, Dict, List, Optional, Type, TypedDict

from flask import g
from flask_caching import Cache
import oso_cloud
from oso_cloud import Oso, Value
from sqlalchemy.orm.session import Session
from sqlalchemy.future import select
from strawberry.types.info import Info

from werkzeug.exceptions import Forbidden, NotFound, Unauthorized

from app.models import User

from . import oso_client
from .oso_client import TypedOso

oso = TypedOso(url=getenv("OSO_URL", "https://api.osohq.com"), api_key=getenv("OSO_AUTH"))
cache = Cache(config={"CACHE_TYPE": "SimpleCache"})


def object_to_oso_value(obj: Any, allow_unbound=False) -> oso_cloud.Value:
    if isinstance(obj, str):
        return {"type": "String", "id": obj}
    elif isinstance(obj, dict):
        assert allow_unbound or ("type" in obj and "id" in obj)
        value: oso_cloud.Value = {}
        if "type" in obj:
            value["type"] = str(obj["type"])
        if "id" in obj:
            value["id"] = str(obj["id"])
        return value
    elif isinstance(obj, User):
        return {"type": "User", "id": str(obj.id)}
    elif obj is None:
        return {}
    else:
        return {"type": obj.__class__.__name__, "id": str(obj.id)}


def oso_user() -> oso_client.User:
    if g.current_user is None:
        raise Unauthorized
    return oso_client.User(g.current_user)

def current_user() -> oso_cloud.Value:
    if g.current_user is None:
        raise Unauthorized
    return {"type": "User", "id": str(g.current_user)}


def tell(predicate: str, *args: Any):
    print(f'oso-cloud tell {predicate} {",".join([str(a) for a in args])}')
    return oso.tell({"name": predicate, "args": [object_to_oso_value(a) for a in args]})


BulkFact = TypedDict("BulkFact", {"name": str, "args": list[Any]})


def bulk_update(delete: list[BulkFact] = [], insert: list[BulkFact] = []):
    delete_facts: list[oso_cloud.VariableFact] = [
        {
            "name": fact["name"],
            "args": [object_to_oso_value(a, allow_unbound=True) for a in fact["args"]],
        }
        for fact in delete
    ]
    insert_facts: list[oso_cloud.Fact] = [
        {"name": fact["name"], "args": [object_to_oso_value(a) for a in fact["args"]]}
        for fact in insert
    ]
    return oso.bulk(delete=delete_facts, tell=insert_facts)


def authorize(action: str, resource: Any, parent: Optional[int] = None) -> bool:
    if g.current_user is None:
        raise Unauthorized
    actor = current_user()
    resource = object_to_oso_value(resource)
    try:
        res = oso.authorize(actor, action, resource)
        print("Allowed" if res else "Denied")
        return res
    except Exception as e:
        print(
            f"error from Oso Cloud: {e} for request: allow({actor}, {action}, {resource})"
        )
        return False


def actions(resource: Any, user: Optional[oso_cloud.Value] = None) -> List[str]:
    if not user and g.current_user is None:
        return []
    actor = oso_user()
    resource = object_to_oso_value(resource)
    try:
        print(f"oso-cloud actions {actor} {resource}")
        res = oso.actions(
            actor,
            resource,
        )
        print(res)
        return sorted(res)
    except Exception as e:
        print(f"error from Oso Cloud: {e} for request: allow({actor}, _, {resource})")
        raise e


def list_resources(
    action: str, resource_type: str, parent: Optional[int] = None
) -> List[str]:
    if g.current_user is None:
        return []

    print(f"oso-cloud list User:{g.current_user} {action} {resource_type}")
    return oso.list(
        {"type": "User", "id": g.current_user},
        action,
        resource_type,
    )


def query(predicate: str, *args: Any):
    print(f'oso-cloud query {predicate} {",".join([str(a) for a in args])}')
    return oso.query(
        {"name": predicate, "args": [object_to_oso_value(a, True) for a in args]}
    )


def get(predicate: str, *args: Any):
    print(f'oso-cloud get {predicate} {",".join([str(a) for a in args])}')
    return oso.get(
        {"name": predicate, "args": [object_to_oso_value(a, True) for a in args]}
    )


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
