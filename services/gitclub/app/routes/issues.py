from flask import Blueprint, g, request, jsonify

from ..models import Issue
from .helpers import check_repo, check_issue, list_resources, object_to_typed_id, oso

bp = Blueprint(
    "issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
@check_repo()
def index(org_id, repo_id):
    args = request.args
    filters = []
    # TODO: these aren't actually possible to set in
    # the UI right now
    if "is:open" in args:
        filters.append(Issue.closed == False)
    if "is:closed" in args:
        filters.append(Issue.closed == True)
    
    issue_ids = list_resources("read", "Issue", repo_id)
    issues = g.session.query(Issue).filter(Issue.repo_id == repo_id, *filters, Issue.id.in_(issue_ids)).order_by(Issue.issue_number)
    return jsonify([issue.as_json() for issue in issues])


@bp.route("", methods=["POST"])
@check_repo("create_issues")
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    issue = Issue(title=payload["title"], repo_id=repo_id, creator_id=g.current_user.username)
    g.session.add(issue)
    g.session.commit()
    oso.bulk_tell(
        [
            ["has_role", *[object_to_typed_id(arg) for arg in [g.current_user, "creator", issue]]],
            ["has_relation", *[object_to_typed_id(arg) for arg in [issue, "repository", {"type": "Repository", "id": repo_id}]]],
        ]
    )
    return issue.as_json(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
@check_issue()
def show(org_id, repo_id, issue_id, permissions):
    issue = g.session.get_or_404(Issue, id=issue_id, repo_id=repo_id)
    json = issue.as_json()
    json["permissions"] = permissions
    return json


@bp.route("/<int:issue_id>", methods=["PATCH"])
@check_issue("close")
def update(org_id, repo_id, issue_id):
    payload = request.get_json(force=True)
    issue = g.session.get_or_404(Issue, id=issue_id, repo_id=repo_id)
    if "closed" in payload:
        issue.closed = payload["closed"]
        g.session.add(issue)
        g.session.commit()
    return issue.as_json()

