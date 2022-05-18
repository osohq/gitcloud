from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Org
from .helpers import oso

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    authorized_ids = oso.list(g.current_user, "read", "Org")
    if authorized_ids[0] == "*":
        orgs = g.session.query(Org)
        return jsonify([o.repr() for o in orgs])
    else:
        orgs = g.session.query(Org).filter(Org.id.in_(authorized_ids))
        return jsonify([o.repr() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    if not oso.authorize(g.current_user, "create", org):
        raise Forbidden
    g.session.add(org)
    g.session.commit()
    oso.tell("has_role", g.current_user, "owner", org)
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "read", org):
        raise NotFound
    return org.repr()
