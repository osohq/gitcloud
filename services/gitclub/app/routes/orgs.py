from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Organization
from .helpers import actions, authorize, authorized_resources, oso, get, cache

bp = Blueprint("orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = authorized_resources("read", "Organization")
    if authorized_ids and authorized_ids[0] == "*":
        orgs = g.session.query(Organization).order_by(Organization.id).limit(5)
        return jsonify([o.as_json() for o in orgs])
    else:
        orgs = g.session.query(Organization).filter(Organization.id.in_(authorized_ids)).order_by(Organization.id).limit(5)
        return jsonify([o.as_json() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Organization(**payload)
    if not authorize("create", "Organization"):
        raise Forbidden
    g.session.add(org)
    g.session.commit()  
    oso.tell("has_role", g.current_user, "admin", org)
    return org.as_json(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    org = g.session.get_or_404(Organization, id=org_id)
    json = org.as_json()
    json["permissions"] = actions(org)
    return json

@bp.route("/<int:org_id>/user_count", methods=["GET"])
@cache.memoize()
def user_count(org_id):
    if not authorize("read", {"type": "Organization", "id": str(org_id)}):
        raise NotFound
    org_users = get("has_role", { "type": "User",  }, {}, { "type": "Organization", "id": str(org_id) })
    print("org users: ", org_users)
    return str(len(list(org_users)))
