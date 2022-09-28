from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Organization
from .helpers import actions, authorize, check, list_resources, oso, get, cache, tell

bp = Blueprint("orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = list_resources("read", "Organization")
    if authorized_ids and authorized_ids[0] == "*":
        orgs = g.session.query(Organization).order_by(Organization.id)
        return jsonify([o.as_json() for o in orgs])
    else:
        orgs = g.session.query(Organization).filter(Organization.id.in_(authorized_ids)).order_by(Organization.id)
        return jsonify([o.as_json() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    if g.session.query(Organization).filter(Organization.name==payload["name"]).first() is not None:
        return "Organization with that name already exists", 400
    org = Organization(**payload)
    if not authorize("create", "Organization"):
        raise Forbidden
    g.session.add(org)
    g.session.commit()
    tell("has_role", g.current_user, "admin", org)
    return org.as_json(), 201


@bp.route("/<int:org_id>", methods=["GET"])
@check("read", "Organization")
def show(org_id, permissions):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    org = g.session.get_or_404(Organization, id=org_id)
    json = org.as_json()
    json["permissions"] = permissions
    return json

@bp.route("/<int:org_id>", methods=["DELETE"])
@check("delete", "Organization")
def delete(org_id):
    org = g.session.get_or_404(Organization, id=org_id)
    g.session.delete(org)
    g.session.commit()
    return "deleted", 204

@bp.route("/<int:org_id>/user_count", methods=["GET"])
@check("read", "Organization")
@cache.memoize()
def user_count(org_id):
    org_users = get("has_role", { "type": "User",  }, {}, { "type": "Organization", "id": str(org_id) })
    return str(len(list(org_users)))
