from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Org, Repo, User
from .helpers import oso

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


# TODO(gj): We're no longer checking "read" on users or roles
@bp.route("/unassigned_users", methods=["GET"])
def org_unassigned_users_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "list_role_assignments", org):
        raise Forbidden
    existing = oso.get("has_role", User, None, org)
    existing_ids = {e["args"][0]["id"] for e in existing}
    unassigned = g.session.query(User).filter(User.id.notin_(existing_ids))
    return jsonify([u.repr() for u in unassigned])


# TODO(gj): We're no longer checking "read" on users or roles
@bp.route("/role_assignments", methods=["GET"])
def org_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "list_role_assignments", org):
        raise Forbidden
    assignments = oso.get("has_role", User, None, org)
    assignments = {(a["args"][0]["id"], a["args"][1]["id"]) for a in assignments}
    # TODO(gj): fetch users in bulk
    assignments = [
        {
            # TODO(gj): probably possible to retrieve IDs in has_role facts for
            # users that have been deleted in the client datastore (if only
            # transiently since the transactional deletion of a user across
            # client & Oso Cloud isn't currently isolated). In that case, we
            # should guard against this query returning no results.
            "user": g.session.get_or_404(User, id=id).repr(),
            "role": role,
        }
        for (id, role) in assignments
    ]
    return jsonify(assignments)


@bp.route("/role_assignments", methods=["POST"])
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "list_role_assignments", org):
        raise NotFound
    if not oso.authorize(g.current_user, "create_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    oso.tell("has_role", user, payload["role"], org)
    return {"user": user.repr(), "role": payload["role"]}, 201


# TODO(gj): We're no longer checking "read" on roles -- kind of a meta 'who
# watches the watchmen' situation for access control to managing roles via Oso
# Cloud.
@bp.route("/role_assignments", methods=["PATCH"])
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "list_role_assignments", org):
        raise NotFound
    if not oso.authorize(g.current_user, "update_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    # TODO(gj): bulk delete
    for role in oso.get("has_role", user, None, org):
        role = role["args"][1]["id"]
        oso.delete("has_role", user, role, org)
    oso.tell("has_role", user, payload["role"], org)
    return {"user": user.repr(), "role": payload["role"]}


# TODO(gj): We're no longer checking "read" on roles -- kind of a meta 'who
# watches the watchmen' situation for access control to managing roles via Oso
# Cloud.
@bp.route("/role_assignments", methods=["DELETE"])
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    if not oso.authorize(g.current_user, "list_role_assignments", org):
        raise NotFound
    if not oso.authorize(g.current_user, "delete_role_assignments", org):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    # TODO(gj): bulk delete
    for role in oso.get("has_role", user, None, org):
        role = role["args"][1]["id"]
        oso.delete("has_role", user, role, org)
    return current_app.response_class(status=204, mimetype="application/json")


# TODO(gj): We're no longer checking "read" on users or roles
@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_role_assignments", repo):
        raise NotFound
    if not oso.authorize(g.current_user, "create_role_assignments", repo):
        raise Forbidden
    existing = oso.get("has_role", User, None, repo)
    existing_ids = {e["args"][0]["id"] for e in existing}
    unassigned = g.session.query(User).filter(User.id.notin_(existing_ids))
    return jsonify([u.repr() for u in unassigned])


# TODO(gj): We're no longer checking "read" on users or roles
@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_role_assignments", repo):
        raise Forbidden
    assignments = oso.get("has_role", User, None, repo)
    assignments = {(a["args"][0]["id"], a["args"][1]["id"]) for a in assignments}
    # TODO(gj): fetch users in bulk
    assignments = [
        {
            # TODO(gj): probably possible to retrieve IDs in has_role facts for
            # users that have been deleted in the client datastore (if only
            # transiently since the transactional deletion of a user across
            # client & Oso Cloud isn't currently isolated). In that case, we
            # should guard against this query returning no results.
            "user": g.session.get_or_404(User, id=id).repr(),
            "role": role,
        }
        for (id, role) in assignments
    ]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_role_assignments", repo):
        raise NotFound
    if not oso.authorize(g.current_user, "create_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?
    oso.tell("has_role", user, payload["role"], repo)
    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_role_assignments", repo):
        raise NotFound
    if not oso.authorize(g.current_user, "update_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    # TODO(gj): bulk delete
    for role in oso.get("has_role", user, None, repo):
        role = role["args"][1]["id"]
        oso.delete("has_role", user, role, repo)
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    oso.tell("has_role", user, payload["role"], repo)
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
# @session({Repo: "list_role_assignments", User: "read"})
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_role_assignments", repo):
        raise NotFound
    if not oso.authorize(g.current_user, "delete_role_assignments", repo):
        raise Forbidden
    user = g.session.get_or_404(User, id=payload["user_id"])
    if not oso.authorize(g.current_user, "read", user):
        raise NotFound
    # TODO(gj): bulk delete
    for role in oso.get("has_role", user, None, repo):
        role = role["args"][1]["id"]
        oso.delete("has_role", user, role, repo)
    return current_app.response_class(status=204, mimetype="application/json")
