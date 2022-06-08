from flask import Blueprint, jsonify

bp = Blueprint("routes.role_choices", __name__)


@bp.route("/org_role_choices", methods=["GET"])
def org_roles():
    return jsonify(["member", "owner"])


@bp.route("/repo_role_choices", methods=["GET"])
def repo_roles():
    return jsonify(["admin", "reader", "maintainer"])
