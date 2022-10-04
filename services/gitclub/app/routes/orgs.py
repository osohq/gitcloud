from flask import Blueprint, g, request, jsonify
from typing import cast
from werkzeug.exceptions import Forbidden, NotFound

from ..events import event

from ..models import Organization, Event
from ..authorization import actions, authorize, list_resources, oso, get, cache, tell

bp = Blueprint("orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = list_resources("read", "Organization")
    if authorized_ids and authorized_ids[0] == "*":
        orgs = g.session.query(Organization).order_by(Organization.id)
        return jsonify([o.as_json() for o in orgs])
    else:
        orgs = (
            g.session.query(Organization)
            .filter(Organization.id.in_(authorized_ids))
            .order_by(Organization.id)
        )
        return jsonify([o.as_json() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = cast(dict, request.get_json(force=True))
    if (
        g.session.query(Organization)
        .filter(Organization.name == payload["name"])
        .first()
        is not None
    ):
        return "Organization with that name already exists", 400
    org = Organization(**payload)
    if not authorize("create", "Organization"):
        event("create_org_failed", {"name": org.name})
        raise Forbidden
    g.session.add(org)
    event("create_org", {"name": org.name})
    g.session.commit()
    tell("has_role", g.current_user, "admin", org)
    return org.as_json(), 201  # type: ignore


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    org = g.session.get_or_404(Organization, id=org_id)
    json = org.as_json()
    json["permissions"] = actions(org)
    return json


@bp.route("/<int:org_id>", methods=["DELETE"])
def delete(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    if not authorize("delete", {"type": "Organization", "id": org_id}):
        event("delete_org_failed", {"id": org_id})
        raise Forbidden
    org = g.session.get_or_404(Organization, id=org_id)
    g.session.delete(org)
    oso.bulk(
        delete=[
            {
                "name": "has_role",
                "args": [None, None, {"type": "Organization", "id": str(org_id)}],
            },
            {
                "name": "has_relation",
                "args": [None, None, {"type": "Organization", "id": str(org_id)}],
            },
        ],
    )
    event("delete_org", {"name": org.name})
    g.session.commit()
    return "deleted", 204


@bp.route("/<int:org_id>/user_count", methods=["GET"])
@cache.memoize()
def user_count(org_id):
    if not authorize("read", {"type": "Organization", "id": str(org_id)}):
        raise NotFound
    org_users = get(
        "has_role",
        {
            "type": "User",
        },
        {},
        {"type": "Organization", "id": str(org_id)},
    )
    return str(len(list(org_users)))
