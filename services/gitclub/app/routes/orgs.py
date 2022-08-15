from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Organization
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = authorized_resources("read", "Organization")
    if authorized_ids and authorized_ids[0] == "*":
        orgs = g.session.query(Organization)
        return jsonify([o.as_json() for o in orgs])
    else:
        orgs = g.session.query(Organization).filter(Organization.id.in_(authorized_ids))
        return jsonify([o.as_json() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Organization(**payload)
    if not authorize("create_organization", "Application"):
        raise Forbidden
    g.session.add(org)
    g.session.commit()  
    oso.tell("has_role", g.current_user, "admin", org)
    return org.as_json(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        print("Denied")
        # raise NotFound("but really permission denied")
    print(f"Fetching org: {org_id}")
    org = g.session.get_or_404(Organization, id=org_id)
    return org.as_json()
