from datetime import timedelta
import os
from flask import g, Flask, session as flask_session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound, Unauthorized, InternalServerError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .models import Base, User, setup_schema
from .fixtures import load_fixture_data
from .routes.helpers import oso, cache
from .tracing import instrument_app

PRODUCTION = os.environ.get("PRODUCTION", "0") == "1"
PRODUCTION_DB = os.environ.get("PRODUCTION_DB", PRODUCTION)
TRACING = os.environ.get("TRACING", PRODUCTION)
WEB_URL = "https://gitcloud.vercel.app" if PRODUCTION else os.environ.get("WEB_URL", "http://localhost:8000")

def create_app(db_path="sqlite:///roles.db", load_fixtures=False):
    from . import routes

    if PRODUCTION_DB:
        engine=create_engine(os.environ["DATABASE_URL"])
    else:
        # Init DB engine.
        engine = create_engine(
            db_path,
            # ignores errors from reusing connections across threads
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    # Init Flask app.
    app = Flask(__name__)
    app.config["SESSION_COOKIE_SECURE"] = PRODUCTION
    app.config["SESSION_COOKIE_SAMESITE"] = "Strict"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(1)

    cache.init_app(app)
    instrument_app(app) if TRACING else None
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.issues.bp)
    app.register_blueprint(routes.orgs.bp)
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
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        oso.api.clear_data()
        load_fixture_data(Session())
        return {}

    Base.metadata.create_all(bind=engine)
    setup_schema(Base)

    # Init session factory
    Session = sessionmaker(bind=engine)

    if load_fixtures:
        # Called during tests to reset the database
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        load_fixture_data(Session())


    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True
        g.session = Session()

        if "current_user" not in g:
            if "current_username" in flask_session:
                username = flask_session.get("current_username")
                user = g.session.query(User).filter_by(username=username).one_or_none()
                if user is None:
                    flask_session.pop("current_username")
                g.current_user = user
            else:
                g.current_user = None

    @app.after_request
    def add_cors_headers(res):
        res.headers.add("Access-Control-Allow-Origin", WEB_URL)
        res.headers.add("Vary", "Origin")
        res.headers.add("Access-Control-Allow-Headers", "Accept,Content-Type,Cookie")
        res.headers.add("Access-Control-Allow-Methods", "DELETE,GET,OPTIONS,PATCH,POST")
        res.headers.add("Access-Control-Allow-Credentials", "true")
        res.headers.add("Access-Control-Expose-Headers", "*, Authorization")
        res.headers.add("Access-Control-Max-Age", "60")

        return res

    @app.after_request
    def close_session(res):
        if "session" in g:
            g.session.close()
        return res

    return app
