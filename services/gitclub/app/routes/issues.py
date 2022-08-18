from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Repository, Issue
from .helpers import authorize, authorized_resources, oso

bp = Blueprint(
    "issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    issues = g.session.query(Issue).filter(Issue.repo_id == repo_id)
    return jsonify([issue.as_json() for issue in issues])


@bp.route("", methods=["POST"])
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repository, id=repo_id)
    if not authorize("create_issues", repo):
        raise NotFound
    issue = Issue(title=payload["title"], repo=repo, creator_id=g.current_user.username)
    g.session.add(issue)
    g.session.commit()
    oso.bulk_tell(
        [
            ["has_role", g.current_user, "creator", issue],
            ["has_relation", issue, "repository", repo],
        ]
    )
    return issue.as_json(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
def show(org_id, repo_id, issue_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    issue = g.session.get_or_404(Issue, id=issue_id)
    return issue.as_json()


@bp.route("/<int:issue_id>/close", methods=["PUT"])
def close(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    if not authorize("read", issue):
        raise NotFound
    if not authorize("close", issue):
        raise Forbidden
    issue.closed = True
    g.session.add(issue)
    g.session.commit()
    return issue.as_json()
