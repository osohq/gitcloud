from flask import Blueprint, g, request, current_app, jsonify
from typing import cast
from werkzeug.exceptions import Forbidden, NotFound

import oso_cloud
from .orgs import user_count
from ..models import Organization, Repository, User
from .authorization import (
    actions,
    authorize,
    get,
    cache,
    tell,
    bulk_update,
)

bp = Blueprint("role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
def org_unassigned_users_index(org_id):
    permissions = actions({"type": "Organization", "id": org_id})
    if not "read" in permissions:
        raise NotFound
    elif not "view_members" in permissions:
        raise Forbidden
    existing: list[oso_cloud.Fact] = get(
        "has_role", {"type": "User"}, {}, {"type": "Organization", "id": org_id}
    )
    existing_ids = {cast(oso_cloud.Value, e["args"][0])["id"] for e in existing}
    unassigned = g.session.query(User).filter(User.username.notin_(existing_ids))
    return jsonify([u.as_json() for u in unassigned])


@bp.route("/role_assignments", methods=["GET"])
def org_index(org_id):
    permissions = actions({"type": "Organization", "id": org_id})
    if not "read" in permissions:
        raise NotFound
    elif not "view_members" in permissions:
        raise Forbidden

    assignment_facts: list[oso_cloud.Fact] = get(
        "has_role", {"type": "User"}, None, {"type": "Organization", "id": org_id}
    )
    assignment_ids = [
        (
            cast(oso_cloud.Value, a["args"][0])["id"],
            cast(oso_cloud.Value, a["args"][1])["id"],
        )
        for a in assignment_facts
    ]
    assignments_ids = sorted(assignment_ids, key=lambda assignment: assignment[0])
    assignments = [
        (g.session.query(User).filter_by(username=user_id).first(), role)
        for (user_id, role) in assignment_ids
    ]
    # TODO(gj): fetch users in bulk
    assignments_json = [
        {
            "user": user.as_json(),
            "role": role,
        }
        for (user, role) in assignments
        if user is not None
    ]
    return jsonify(assignments_json)


@bp.route("/role_assignments", methods=["POST"])
def org_create(org_id):
    payload = cast(dict, request.get_json(force=True))
    permissions = actions({"type": "Organization", "id": org_id})
    if not "read" in permissions:
        raise NotFound
    elif not "manage_members" in permissions:
        raise Forbidden
    cache.delete_memoized(user_count, org_id)

    org = g.session.get_or_404(Organization, id=org_id)
    user = {"type": "User", "id": payload["username"]}
    if not authorize("read", user):
        raise NotFound
    tell("has_role", user, payload["role"], org)

    user_obj: User = g.session.get_or_404(User, username=user["id"])
    return {"user": user_obj.as_json(), "role": payload["role"]}, 201  # type: ignore


@bp.route("/role_assignments", methods=["PATCH"])
def org_update(org_id):
    payload = cast(dict, request.get_json(force=True))
    permissions = actions({"type": "Organization", "id": org_id})
    if not "read" in permissions:
        raise NotFound
    elif not "manage_members" in permissions:
        raise Forbidden
    cache.delete_memoized(user_count, org_id)
    org = g.session.get_or_404(Organization, id=org_id)
    user = {"type": "User", "id": payload["username"]}
    if not authorize("read", user):
        raise NotFound

    bulk_update(
        delete=[{"name": "has_role", "args": [user, None, org]}],
        insert=[{"name": "has_role", "args": [user, payload["role"], org]}],
    )

    user_obj: User = g.session.get_or_404(User, username=user["id"])
    return {"user": user_obj.as_json(), "role": payload["role"]}  # type: ignore


@bp.route("/role_assignments", methods=["DELETE"])
def org_delete(org_id):
    payload = cast(dict, request.get_json(force=True))
    permissions = actions({"type": "Organization", "id": org_id})
    if not "read" in permissions:
        raise NotFound
    elif not "manage_members" in permissions:
        raise Forbidden
    cache.delete_memoized(user_count, org_id)
    org = g.session.get_or_404(Organization, id=org_id)
    user = {"type": "User", "id": payload["username"]}
    if not authorize("read", user):
        raise NotFound

    bulk_update(delete=[{"name": "has_role", "args": [user, None, org]}])

    return {}, 204


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    if not authorize("view_members", repo):
        raise NotFound
    if not authorize("manage_members", repo):
        raise Forbidden
    existing = get(
        "has_role", {"type": User}, None, {"type": "Repository", "id": repo.id}
    )
    existing_ids = {cast(oso_cloud.Value, fact["args"][0])["id"] for fact in existing}
    unassigned = g.session.query(User).filter(User.username.notin_(existing_ids))
    return jsonify([u.as_json() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    if not authorize("view_members", repo):
        raise Forbidden
    assignment_facts = get(
        "has_role", {"type": "User"}, None, {"type": "Repository", "id": repo_id}
    )
    assignment_ids = [
        (
            cast(oso_cloud.Value, a["args"][0])["id"],
            cast(oso_cloud.Value, a["args"][1])["id"],
        )
        for a in assignment_facts
    ]
    assignment_ids = sorted(assignment_ids, key=lambda assignment: assignment[0])
    assignments = [
        (g.session.query(User).filter_by(username=user_id).first(), role)
        for (user_id, role) in assignment_ids
    ]
    # TODO(gj): fetch users in bulk
    assignments_json = [
        {
            "user": user.as_json(),
            "role": role,
        }
        for (user, role) in assignments
        if user is not None
    ]
    return jsonify(assignments_json)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
def repo_create(org_id, repo_id):
    payload = cast(dict, request.get_json(force=True))
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    if not authorize("view_members", repo):
        raise NotFound
    if not authorize("manage_members", repo):
        raise Forbidden
    user = {"type": "User", "id": payload["username"]}
    if not authorize("read", user):
        raise NotFound
    tell("has_role", user, payload["role"], repo)
    user_obj: User = g.session.get_or_404(User, username=user["id"])
    return {"user": user_obj.as_json(), "role": payload["role"]}, 201  # type: ignore


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
def repo_update(org_id, repo_id):
    payload = cast(dict, request.get_json(force=True))
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    if not authorize("view_members", repo):
        raise NotFound
    if not authorize("manage_members", repo):
        raise Forbidden
    user: oso_cloud.Value = {"type": "User", "id": str(payload["username"])}

    bulk_update(
        delete=[{"name": "has_role", "args": [user, None, repo]}],
        insert=[{"name": "has_role", "args": [user, payload["role"], repo]}],
    )

    user_obj = g.session.get_or_404(User, username=user["id"])

    return {"user": user_obj.as_json(), "role": payload["role"]}  # type: ignore


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
def repo_delete(org_id, repo_id):
    payload = cast(dict, request.get_json(force=True))
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    if not authorize("view_members", repo):
        raise NotFound
    if not authorize("manage_members", repo):
        raise Forbidden
    user: oso_cloud.Value = {"type": "User", "id": str(payload["username"])}

    bulk_update(delete=[{"name": "has_role", "args": [user, None, repo]}])
    return {}, 204
