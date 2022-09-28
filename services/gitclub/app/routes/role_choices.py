from flask import Blueprint, jsonify

bp = Blueprint("role_choices", __name__)


@bp.route("/org_role_choices", methods=["GET"])
def org_roles():
    return jsonify(["member", "admin"])


@bp.route("/repo_role_choices", methods=["GET"])
def repo_roles():
    return jsonify(["reader", "editor", "maintainer", "admin"])
