from datetime import timedelta
import os
from typing import Any
from flask import g, Flask, request, session as flask_session
from werkzeug.exceptions import (
    BadRequest,
    Forbidden,
    NotFound,
    Unauthorized,
    InternalServerError,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .models import Base, User, setup_schema
from .fixtures import load_fixture_data
from .authorization import oso, cache
from .tracing import instrument_app

PRODUCTION = os.environ.get("PRODUCTION", "0") == "1"
PRODUCTION_DB = os.environ.get("PRODUCTION_DB", PRODUCTION)
TRACING = os.environ.get("TRACING", PRODUCTION)
WEB_URL = (
    "https://gitcloud.vercel.app"
    if PRODUCTION
    else os.environ.get("WEB_URL", "http://localhost:8000")
)

def create_app(db_path="sqlite:///roles.db", load_fixtures=False):
    from . import routes

    if PRODUCTION_DB:
        engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True, echo=True)
    else:
        # Init DB engine.
        engine = create_engine(
            db_path,
            # ignores errors from reusing connections across threads
            # connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=True,
        )

    # Init Flask app.
    app = Flask(__name__)

    app.config["SESSION_COOKIE_SECURE"] = PRODUCTION
    app.config["SESSION_COOKIE_SAMESITE"] = "None"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(1)

    cache.init_app(app)
    instrument_app(app) if TRACING else None
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.orgs.bp)
    app.register_blueprint(routes.orgs_repos.bp)
    app.register_blueprint(routes.repos.bp)
    app.register_blueprint(routes.role_assignments.bp)
    app.register_blueprint(routes.role_choices.bp)
    app.register_blueprint(routes.session.bp)
    app.register_blueprint(routes.users.bp)

    # Set up error handlers.
    @app.errorhandler(BadRequest)
    def handle_bad_request(*_):
        return {"message": "Bad Request"}, 400

    @app.errorhandler(Forbidden)
    def handle_forbidden(*_):
        return {"message": "Forbidden"}, 403

    @app.errorhandler(NotFound)
    def handle_not_found(*_):
        return {"message": "Not Found"}, 404

    @app.errorhandler(Unauthorized)
    def handle_unauthorized(*_):
        return {"message": "Unauthorized"}, 401

    @app.errorhandler(InternalServerError)
    def handle_ise(error: InternalServerError):
        return {"message": error.description}, 500

    @app.route("/_reset", methods=["POST"])
    def reset_data():
        # Called during tests to reset the database
        Base.metadata.drop_all(bind=engine)  # type: ignore
        Base.metadata.create_all(bind=engine)  # type: ignore
        load_fixture_data(Session())
        return {}

    Base.metadata.create_all(bind=engine)  # type: ignore
    setup_schema(Base)

    # Init session factory
    Session = sessionmaker(bind=engine)

    if load_fixtures:
        # Called during tests to reset the database
        Base.metadata.drop_all(bind=engine)  # type: ignore
        Base.metadata.create_all(bind=engine)  # type: ignore
        load_fixture_data(Session())
        return

    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True
        g.session = Session()
        request_id = request.headers.get("oso-request-id")
        g.oso_request_id = request_id

        if "current_user" not in g:
            if "user_id" in flask_session:
                user_id = flask_session.get("user_id")
                g.current_user = user_id
            elif "x-user-id" in request.headers:
                user_id = request.headers["x-user-id"]
                g.current_user = user_id
            else:
                g.current_user = None

    @app.after_request
    def add_cors_headers(res):
        res.headers.add("Access-Control-Allow-Origin", WEB_URL)
        res.headers.add("Vary", "Origin")
        res.headers.add("Access-Control-Allow-Headers", "Accept,Content-Type,x-user-id")
        res.headers.add("Access-Control-Allow-Methods", "DELETE,GET,OPTIONS,PATCH,POST")
        res.headers.add("Access-Control-Allow-Credentials", "true")
        res.headers.add("Access-Control-Max-Age", "60")

        return res

    @app.after_request
    def close_session(res):
        if "session" in g:
            g.session.close()
        return res

    return app


if __name__ == "__main__":
    app = create_app()
    if app:
        app.run()
