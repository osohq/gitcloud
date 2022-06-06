from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Repo, Issue
from .helpers import authorize, authorized_resources, oso

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not authorize("list_issues", repo):
        raise NotFound
    authorized_ids = authorized_resources("read", "Issue")
    if authorized_ids and authorized_ids[0] == "*":
        issues = g.session.query(Issue)
        return jsonify([issue.repr() for issue in issues])
    else:
        issues = g.session.query(Issue).filter(Issue.id.in_(authorized_ids))
        return jsonify([issue.repr() for issue in issues])


@bp.route("", methods=["POST"])
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not authorize("create_issues", repo):
        raise NotFound
    issue = Issue(title=payload["title"], repo=repo, creator_id=g.current_user.id)
    g.session.add(issue)
    g.session.commit()
    oso.bulk_tell(
        [
            ["has_role", g.current_user, "creator", issue],
            ["has_relation", issue, "parent", repo],
        ]
    )
    return issue.repr(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
def show(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    if not authorize("read", issue):
        raise NotFound
    return issue.repr()


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
    return issue.repr()
