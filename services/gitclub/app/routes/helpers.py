from os import getenv
from typing import Any, List, Type

from flask import g
from oso_cloud import Oso
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound, Unauthorized

oso = Oso(url=getenv("OSO_URL", "https://cloud.osohq.com"), api_key=getenv("OSO_AUTH"))

def object_to_typed_id(obj: Any) -> dict:
    if isinstance(obj, str):
        return obj
    elif isinstance(obj, dict):
        assert "type" in obj and "id" in obj
        obj["type"] = str(obj["type"])
        obj["id"] = str(obj["id"])
        return obj
    else:
        return { "type": obj.__class__.__name__, "id": str(obj.id) }

def authorize(action: str, resource: Any) -> bool:
    if g.current_user is None:
        raise Unauthorized
    actor = { "type": "User", "id": g.current_user.username }
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
