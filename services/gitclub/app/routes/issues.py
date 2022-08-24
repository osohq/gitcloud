from flask import Blueprint, g, request, jsonify
from werkzeug.exceptions import Forbidden, NotFound

from ..models import Repository, Issue, User
from .helpers import authorize, current_user, fact, get_facts_for_issue, get_facts_for_repo, object_to_typed_id, oso

bp = Blueprint(
    "issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    args = request.args
    filters = []
    if "is:open" in args:
        filters.append(Issue.closed == False)
    if "is:closed" in args:
        filters.append(Issue.closed == True)
    

    repo = g.session.get_or_404(Repository, id=repo_id)
    # issue_ids = authorized_issues_for_repository(repo)
    issues = g.session.query(Issue).filter(Issue.repo_id == repo_id, *filters)
    return jsonify([issue.as_json() for issue in issues])


@bp.route("", methods=["POST"])
def create(org_id, repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
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
    json = issue.as_json()
    json["permissions"] = authorize_issue_actions(issue)
    return json


@bp.route("/<int:issue_id>/close", methods=["PUT"])
def close(org_id, repo_id, issue_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    issue = g.session.get_or_404(Issue, id=issue_id)
    if not authorize("read", issue):
        raise NotFound
    if not authorize("close", issue):
        raise Forbidden
    issue.closed = True
    g.session.add(issue)
    g.session.commit()
    return issue.as_json()

def authorize_issue(action, issue):
    facts = get_facts_for_issue(issue)
    print(facts)
    return oso.authorize({ "type": "User", "id": g.current_user.username }, action, {"type": "Issue", "id": str(issue.id)}, context_facts=facts)

def authorize_issue_actions(issue):
    facts = get_facts_for_issue(issue)
    return oso.actions({ "type": "User", "id": g.current_user.username }, {"type": "Issue", "id": str(issue.id)}, context_facts=facts)


def authorized_issues_for_repository(repo: Repository):
    repo_facts = get_facts_for_repo(repo)
    if not oso.authorize(current_user(), "read", object_to_typed_id(repo), context_facts=repo_facts):
        raise NotFound
    
    issue_facts = [["has_relation", { "type": "Issue", "id": "*"}, "repository", {"type": "Repository", "id": str(repo.id)}], *repo_facts]
    result = oso.list(current_user(), "read", "Issue", context_facts=issue_facts)
    print(result)
    return result


@fact("has_relation", "user: User", "creator", "issue: Issue")
def user_created_issue(user, issue):
    return user.id == issue.creator_id


@fact("has_relation", "user: User", "\"creator\"", "Issue")
def user_is_creator(user):
    return Issue.creator_id == user.id

@fact("has_relation", "User", "\"creator\"", "issue: Issue")
def issue_has_creator(issue):
    return User.id == issue.creator_id
