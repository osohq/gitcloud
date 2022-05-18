from flask import Blueprint, g, request, jsonify
from flask.globals import current_app
from werkzeug.exceptions import Forbidden

from ..models import Repo, Issue
from .helpers import oso

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    if not oso.authorize(g.current_user, "list_issues", repo):
        raise Forbidden
    authorized_ids = oso.list(g.current_user, "read", "Issue")
    if authorized_ids[0] == "*":
        issues = g.session.query(Issue)
        return jsonify([issue.repr() for issue in issues])
    else:
        issues = g.session.query(Issue).filter(Issue.id.in_(authorized_ids))
        return jsonify([issue.repr() for issue in issues])


@bp.route("", methods=["POST"])
# @session({Repo: "create_issues", Issue: "read"})
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    issue = Issue(title=payload["title"], repo=repo, creator_id=g.current_user.id)
    # check_permission("create", issue)  # TODO(gj): validation check; maybe unnecessary.
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
# @session({Issue: "read"})
def show(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    return issue.repr()


@bp.route("/<int:issue_id>/close", methods=["PUT"])
# @session({Issue: "read"})
def close(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    current_app.oso.authorize(g.current_user, "close", issue)
    issue.closed = True
    g.session.add(issue)
    g.session.commit()
    return issue.repr()
