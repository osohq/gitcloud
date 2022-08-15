import os
from flask import g, Flask, session as flask_session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .models import Base, User, setup_schema
from .fixtures import load_fixture_data
from .routes.helpers import oso
from .tracing import instrument_app

PRODUCTION = os.environ.get("PRODUCTION", "0") == "1"

def create_app(db_path="sqlite:///roles.db", load_fixtures=False):
    from . import routes

    if PRODUCTION or True:
        engine=create_engine(os.environ["DATABASE_URL"] + "gitclub")
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
    # instrument_app(app) if PRODUCTION else None
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
        res.headers.add("Access-Control-Allow-Origin", "https://gitcloud.vercel.app" if PRODUCTION else "http://localhost:3000")
        res.headers.add("Vary", "Origin")
        res.headers.add("Access-Control-Allow-Headers", "Accept,Content-Type")
        res.headers.add("Access-Control-Allow-Methods", "DELETE,GET,OPTIONS,PATCH,POST")
        res.headers.add("Access-Control-Allow-Credentials", "true")
        return res

    @app.after_request
    def close_session(res):
        if "session" in g:
            g.session.close()
        return res

    return app
