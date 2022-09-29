from flask import Blueprint, g, request, jsonify
from typing import cast
from werkzeug.exceptions import NotFound, Forbidden

from ..models import Repository
from .authorization import actions, authorize, list_resources, tell

bp = Blueprint("repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


@bp.route("", methods=["GET"])
def index(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    authorized_ids = list_resources("read", "Repository")
    if authorized_ids and authorized_ids[0] == "*":
        repos = g.session.query(Repository).filter_by(org_id=org_id)
        return jsonify([r.as_json() for r in repos])
    else:
        repos = g.session.query(Repository).filter(
            Repository.id.in_(authorized_ids), Repository.org_id == org_id
        )
        return jsonify([r.as_json() for r in repos])


@bp.route("", methods=["POST"])
def create(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    if not authorize("create_repositories", {"type": "Organization", "id": org_id}):
        raise Forbidden("you do not have permission to create repositories")

    payload = cast(dict, request.get_json(force=True))

    if (
        g.session.query(Repository)
        .filter_by(org_id=org_id, name=payload["name"])
        .first()
        is not None
    ):
        return "Repository with that name already exists", 400

    repo = Repository(name=payload["name"], org_id=org_id)
    g.session.add(repo)
    g.session.commit()
    repoValue = {"type": "Repository", "id": repo.id}
    tell(
        "has_relation",
        repoValue,
        "organization",
        {"type": "Organization", "id": org_id},
    )
    tell("has_role", g.current_user, "admin", repoValue)
    return repo.as_json(), 201  # type: ignore


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    json = repo.as_json()
    json["permissions"] = actions(repo)
    return json


@bp.route("/<int:repo_id>", methods=["DELETE"])
def delete(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    if not authorize("delete", {"type": "Repository", "id": repo_id}):
        raise Forbidden
    repo = g.session.get_or_404(Repository, id=repo_id, org_id=org_id)
    g.session.delete(repo)
    g.session.commit()
    return "deleted", 204
