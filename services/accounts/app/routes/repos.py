from flask import Blueprint, g, request, jsonify
from typing import cast
from werkzeug.exceptions import NotFound, Forbidden


from ..models import Repository
from ..authorization import actions, authorize, list_resources, tell, oso

bp = Blueprint("repos", __name__, url_prefix="/repos")

@bp.route("/<int:repo_id>", methods=["GET"])
def show(repo_id):
    if not authorize("read", {"type": "Repository", "id": repo_id}):
        raise NotFound
    repo = g.session.get_or_404(Repository, id=repo_id)
    json = repo.as_json()
    json["permissions"] = actions(repo)
    return json
