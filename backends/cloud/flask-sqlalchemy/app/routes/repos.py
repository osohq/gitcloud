from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Org, Repo
from .helpers import authorize, authorized_resources, oso

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


@bp.route("", methods=["GET"])
def index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    if not authorize("list_repos", org):
        raise Forbidden
    authorized_ids = authorized_resources("read", "Repo")
    if authorized_ids and authorized_ids[0] == "*":
        repos = g.session.query(Repo).filter_by(org_id=org_id)
        return jsonify([r.repr() for r in repos])
    else:
        repos = g.session.query(Repo).filter(
            Repo.id.in_(authorized_ids), Repo.org_id == org_id
        )
        return jsonify([r.repr() for r in repos])


@bp.route("", methods=["POST"])
def create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    if not authorize("create_repos", org):
        raise Forbidden
    repo = Repo(name=payload["name"], org=org)
    g.session.add(repo)
    g.session.commit()
    oso.tell("has_relation", repo, "parent", org)
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not authorize("read", repo):
        raise NotFound
    return repo.repr()
