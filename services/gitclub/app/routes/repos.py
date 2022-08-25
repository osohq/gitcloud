from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import NotFound, Forbidden

from ..models import Organization, Repository
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


@bp.route("", methods=["GET"])
def index(org_id):
    if not authorize("read", {"type": "Organization", "id": org_id}):
        raise NotFound
    authorized_ids = authorized_resources("read", "Repository")
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

    payload = request.get_json(force=True)
    repo = Repository(name=payload["name"], org_id=org_id)
    g.session.add(repo)
    g.session.commit()
    oso.tell("has_relation", {"type": "Repository", "id": repo.id}, "organization", {"type": "Organization", "id": org_id})
    return repo.as_json(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    repo = g.session.get_or_404(Repository, id=repo_id)
    return repo.as_json()
