from flask import Blueprint, g, request, jsonify
from sqlalchemy import func, text

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
    url_prefix="/"
)

@bp.route("", methods=["GET"])
def index():
    permission = "read"
    if "close" in request.args:
        permission = "close"
    print("\n\n\n\n\nPERMISSION =", permission)

    authorization_filter = oso.list_local(
        {"type": "User", "id": g.current_user},
        permission,
        "Issue",
        "id",
    )
    print(authorization_filter)
    issues = (
        g.session.query(Issue)
        .filter(text(authorization_filter))
        .order_by(func.char_length(Issue.title))
        .limit(20)
    )
    return jsonify([issue.as_json() for issue in issues])