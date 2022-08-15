from flask import Blueprint, g, jsonify
from werkzeug.exceptions import Forbidden

from ..models import User, Repository
from .helpers import authorize, authorized_resources

bp = Blueprint("users", __name__, url_prefix="/users")


@bp.route("/<user_id>", methods=["GET"])
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    if not authorize("read_profile", user):
        raise Forbidden
    return user.as_json()


@bp.route("/<user_id>/repos", methods=["GET"])
def index(user_id):
    user = g.session.get_or_404(User, id=user_id)
    if not authorize("read_profile", user):
        raise Forbidden
    authorized_ids = authorized_resources("read", "Repo")
    if authorized_ids and authorized_ids[0] == "*":
        repos = g.session.query(Repository)
        return jsonify([r.as_json() for r in repos])
    else:
        repos = g.session.query(Repository).filter(Repository.id.in_(authorized_ids))
        return jsonify([r.as_json() for r in repos])
