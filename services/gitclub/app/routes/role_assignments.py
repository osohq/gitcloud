from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Organization, Repository, User
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
def org_unassigned_users_index(org_id):
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_role_assignments", org):
        raise Forbidden
    existing = oso.get("has_role", User, None, org)
    existing_ids = {e["args"][0]["username"] for e in existing}
    unassigned = g.session.query(User).filter(User.username.notin_(existing_ids))
    return jsonify([u.as_json() for u in unassigned])


@bp.route("/role_assignments", methods=["GET"])
def org_index(org_id):
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_role_assignments", org):
        raise NotFound
    assignments = oso.get("has_role", User, None, org)
    assignments = {(a["args"][0]["id"], a["args"][1]["id"]) for a in assignments}
    # TODO(gj): fetch users in bulk
    assignments = [
        {
            "user": g.session.get_or_404(User, id=id).as_json(),
            "role": role,
        }
        for (id, role) in assignments
    ]
    return jsonify(assignments)


@bp.route("/role_assignments", methods=["POST"])
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_role_assignments", org):
        raise NotFound
    if not authorize("create_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.tell("has_role", user, payload["role"], org)
    return {"user": user.as_json(), "role": payload["role"]}, 201


@bp.route("/role_assignments", methods=["PATCH"])
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_role_assignments", org):
        raise NotFound
    if not authorize("update_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.bulk_delete(
        [
            ["has_role", user, role["args"][1]["id"], org]
            for role in oso.get("has_role", user, None, org)
        ]
    )
    oso.tell("has_role", user, payload["role"], org)
    return {"user": user.as_json(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_role_assignments", org):
        raise NotFound
    if not authorize("delete_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.bulk_delete(
        [
            ["has_role", user, role["args"][1]["id"], org]
            for role in oso.get("has_role", user, None, org)
        ]
    )
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("list_role_assignments", repo):
        raise NotFound
    if not authorize("create_role_assignments", repo):
        raise Forbidden
    existing = oso.get("has_role", User, None, repo)
    existing_ids = {e["args"][0]["username"] for e in existing}
    unassigned = g.session.query(User).filter(User.username.notin_(existing_ids))
    return jsonify([u.as_json() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("list_role_assignments", repo):
        raise Forbidden
    assignments = oso.get("has_role", User, None, repo)
    assignments = {(a["args"][0]["id"], a["args"][1]["id"]) for a in assignments}
    # TODO(gj): fetch users in bulk
    assignments = [
        {
            "user": g.session.get_or_404(User, id=id).as_json(),
            "role": role,
        }
        for (id, role) in assignments
    ]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("list_role_assignments", repo):
        raise NotFound
    if not authorize("create_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.tell("has_role", user, payload["role"], repo)
    return {"user": user.as_json(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("list_role_assignments", repo):
        raise NotFound
    if not authorize("update_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.bulk_delete(
        [
            ["has_role", user, role["args"][1]["id"], repo]
            for role in oso.get("has_role", user, None, repo)
        ]
    )
    oso.tell("has_role", user, payload["role"], repo)
    return {"user": user.as_json(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("list_role_assignments", repo):
        raise NotFound
    if not authorize("delete_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not authorize("read", user):
        raise NotFound
    oso.bulk_delete(
        [
            ["has_role", user, role["args"][1]["id"], repo]
            for role in oso.get("has_role", user, None, repo)
        ]
    )
    return current_app.response_class(status=204, mimetype="application/json")
