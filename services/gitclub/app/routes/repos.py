from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import NotFound

from ..models import Organization, Repository
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


@bp.route("", methods=["GET"])
def index(org_id):
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("list_repos", org):
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
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Organization, id=org_id)
    if not authorize("create_repos", org):
        raise NotFound
    repo = Repository(name=payload["name"], org=org)
    g.session.add(repo)
    g.session.commit()
    oso.tell("has_relation", repo, "organization", org)
    return repo.as_json(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("read", repo):
        raise NotFound
    return repo.as_json()
