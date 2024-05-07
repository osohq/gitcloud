from flask import Blueprint, g, jsonify
from typing import cast
from werkzeug.exceptions import Forbidden, Unauthorized, NotFound

from ..models import Organization, User, Repository
from ..authorization import authorize, query

bp = Blueprint("users", __name__, url_prefix="/users")

import oso_cloud


@bp.route("/<user_id>", methods=["GET"])
def show(user_id):
    if not authorize("read", {"type": "User", "id": user_id}):
        raise NotFound
    user = g.session.get_or_404(User, id=user_id)
    return user.as_json()


@bp.route("/<user_id>/repos", methods=["GET"])
def repo_index(user_id):
    if not authorize("read_profile", {"type": "User", "id": user_id}):
        raise NotFound

    # get all the repositories that the user has a role for
    repos = query(
        "has_role", {"type": "User", "id": user_id}, {}, {"type": "Repository"}
    )
    repoIds = list(
        map(lambda fact: cast(oso_cloud.Value, fact["args"][2]).get("id", "_"), repos)
    )
    print(repos, repoIds)
    if "_" in repoIds:
        repo_objs = g.session.query(Repository)
        return jsonify([r.as_json() for r in repo_objs])
    else:
        repo_objs = g.session.query(Repository).filter(Repository.id.in_(repoIds))
        return jsonify([r.as_json() for r in repo_objs])


@bp.route("/<user_id>/orgs", methods=["GET"])
def org_index(user_id):
    if not authorize("read_profile", {"type": "User", "id": user_id}):
        raise NotFound

    # get all the repositories that the user has a role for
    orgs = query(
        "has_role", {"type": "User", "id": user_id}, {}, {"type": "Organization"}
    )
    orgIds = list(
        map(lambda fact: cast(oso_cloud.Value, fact["args"][2]).get("id", "_"), orgs)
    )
    if "_" in orgIds:
        orgs = g.session.query(Organization)
        return jsonify([o.as_json() for o in orgs])
    else:
        orgs = g.session.query(Organization).filter(Organization.id.in_(orgIds))
        return jsonify([o.as_json() for o in orgs])
