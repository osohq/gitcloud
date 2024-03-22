from flask import Blueprint, g, request, jsonify
from typing import cast
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Issue
from ..authorization import (
    actions,
    authorize,
    list_query,
    list_resources,
    object_to_oso_value,
    oso,
)

bp = Blueprint(
    "issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    repo = {"type": "Repository", "id": repo_id}
    if not authorize("read", repo):
        raise NotFound
    args = request.args
    filters = []
    # TODO: these aren't actually possible to set in
    # the UI right now
    if "is:open" in args:
        filters.append(Issue.closed == False)
    if "is:closed" in args:
        filters.append(Issue.closed == True)

    query_filter = list_query("read", "Issue")
    issues = (
        g.session.query(Issue)
        .filter(query_filter)
        .filter_by(repo_id=repo_id)
        .order_by(Issue.id)
        .limit(10)
    )
    return jsonify([issue.as_json() for issue in issues])


@bp.route("", methods=["POST"])
def create(org_id, repo_id):
    repo = {"type": "Repository", "id": repo_id}
    if not authorize("read", repo):
        raise NotFound
    payload = cast(dict, request.get_json(force=True))
    if not authorize("create_issues", repo):
        raise NotFound
    issue = Issue(title=payload["title"], repo=repo, creator_id=g.current_user)
    g.session.add(issue)
    g.session.commit()
    oso.bulk_tell(
        [
            {
                "name": "has_role",
                "args": [
                    object_to_oso_value(arg)
                    for arg in [g.current_user, "creator", issue]
                ],
            },
            {
                "name": "has_relation",
                "args": [
                    object_to_oso_value(arg) for arg in [issue, "repository", repo]
                ],
            },
        ]
    )
    return issue.as_json(), 201  # type: ignore


@bp.route("/<int:issue_id>", methods=["GET"])
def show(org_id, repo_id, issue_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound

    issue = g.session.get_or_404(Issue, id=issue_id)
    json = issue.as_json()
    json["permissions"] = actions(issue)
    return json


@bp.route("/<int:issue_id>", methods=["PATCH"])
def update(org_id, repo_id, issue_id):
    payload = cast(dict, request.get_json(force=True))
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    issue = g.session.get_or_404(Issue, id=issue_id, repo_id=repo_id)
    permissions = actions(issue)
    if not "read" in permissions:
        raise NotFound

    if "closed" in payload:
        if not "close" in permissions:
            raise Forbidden
        issue.closed = payload["closed"]
        g.session.add(issue)
        g.session.commit()
    return issue.as_json()
