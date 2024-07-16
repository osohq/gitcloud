from flask import Blueprint, g, request, jsonify
from typing import cast
from werkzeug.exceptions import Forbidden, NotFound


from ..models import Organization
from ..authorization import oso_user, oso
from oso_cloud import Value

bp = Blueprint("orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = oso.list_organizations(oso_user(), "read")
    if authorized_ids == ["*"]:
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
    user: Value = {
        "type": "User",
        "id": str(g.current_user),
    }
    if not oso.authorize(user, "create", "Organization"):
        raise Forbidden
    g.session.add(org)
    g.session.commit()
    oso.tell(
        {
            "name": "has_role",
            "args": [user, "admin", {"type": "Organization", "id": str(org.id)}],
        }
    )
    return org.as_json(), 201  # type: ignore


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    user: Value = {
        "type": "User",
        "id": str(g.current_user),
    }
    if not oso.authorize(user, "read", {"type": "Organization", "id": org_id}):
        raise NotFound
    org = g.session.get_or_404(Organization, id=org_id)
    json = org.as_json()
    json["permissions"] = oso.actions(oso_user(), {"type": "Organization", "id": org_id})
    return json


@bp.route("/<int:org_id>", methods=["DELETE"])
def delete(org_id):
    user: Value = {
        "type": "User",
        "id": str(g.current_user),
    }
    if not oso.authorize(user, "read", {"type": "Organization", "id": org_id}):
        raise NotFound
    if not oso.authorize(user, "delete", {"type": "Organization", "id": org_id}):
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
            {
                "name": "has_relation",
                "args": [{"type": "Organization", "id": str(org_id)}, None, None],
            }
        ],
        tell=[
            {"name": "has_role", "args": [None, None, {"type": "Organization", "id": str(org_id)}]},
        ]
    )
    g.session.commit()
    return "deleted", 204


@bp.route("/<int:org_id>/user_count", methods=["GET"])
def user_count(org_id):
    user: Value = {
        "type": "User",
        "id": str(g.current_user),
    }
    if not oso.authorize(user, "read", {"type": "Organization", "id": str(org_id)}):
        raise NotFound
    org_users = oso.get(
        {
            "name": "has_role",
            "args": [
                {
                    "type": "User",
                },
                {},
                {"type": "Organization", "id": str(org_id)},
            ],
        }
    )
    return str(len(list(org_users)))
