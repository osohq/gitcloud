from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Org
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = authorized_resources("read", "Org")
    if authorized_ids and authorized_ids[0] == "*":
        orgs = g.session.query(Org)
        return jsonify([o.repr() for o in orgs])
    else:
        orgs = g.session.query(Org).filter(Org.id.in_(authorized_ids))
        return jsonify([o.repr() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    if not authorize("create", org):
        raise Forbidden
    g.session.add(org)
    g.session.commit()
    oso.tell("has_role", g.current_user.repr(), "owner", org.repr())
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    if not authorize("read", org):
        raise NotFound
    return org.repr()
