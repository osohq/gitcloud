from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from typing import cast
from werkzeug.exceptions import BadRequest, Unauthorized

from ..models import User

bp = Blueprint("session", __name__, url_prefix="/session")


@bp.route("", methods=["GET"])
def show():
    return jsonify(g.current_user.as_json() if g.current_user else None)


@bp.route("/login", methods=["POST"])
def create():
    payload = cast(dict, request.get_json(force=True))
    if "username" not in payload:
        raise BadRequest
    user = g.session.query(User).filter_by(username=payload["username"]).one_or_none()
    if user is None:
        flask_session.pop("current_username", None)
        raise Unauthorized
    flask_session["current_username"] = user.username
    return jsonify(user.as_json()), 201


@bp.route("/logout", methods=["DELETE"])
def delete():
    flask_session.pop("current_username", None)
    return {}, 204
