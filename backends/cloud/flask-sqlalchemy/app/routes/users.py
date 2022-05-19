from flask import Blueprint, g, jsonify
from werkzeug.exceptions import Forbidden

from ..models import User, Repo
from .helpers import authorize, authorized_resources

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    if not authorize("read_profile", user):
        raise Forbidden
    return user.repr()


@bp.route("/<int:user_id>/repos", methods=["GET"])
def index(user_id):
    user = g.session.get_or_404(User, id=user_id)
    if not authorize("read_profile", user):
        raise Forbidden
    authorized_ids = authorized_resources("read", "Repo")
    if authorized_ids[0] == "*":
        repos = g.session.query(Repo)
        return jsonify([r.repr() for r in repos])
    else:
        repos = g.session.query(Repo).filter(Repo.id.in_(authorized_ids))
        return jsonify([r.repr() for r in repos])
