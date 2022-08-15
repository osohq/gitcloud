from os import getenv
from typing import Any, List, Type

from flask import g
from oso_cloud import Oso
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound

oso = Oso(url=getenv("OSO_URL", "https://cloud.osohq.com"), api_key=getenv("OSO_AUTH"))


def authorize(action: str, resource: Any) -> bool:
    if g.current_user is None:
        raise NotFound
    return oso.authorize({ "type": "User", "id": g.current_user.username }, action, { "type": resource.__class__, "id": resource.id })


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
