from .models import Issue, Org, Repo, User
from .routes.helpers import oso


def load_fixture_data(session):
    #########
    # Users #
    #########

    toto = User(id="Toto Wolff")
    george = User(id="George Russell")
    lewis = User(id="Lewis Hamilton")
    christian = User(id="Christian Horner")
    max = User(id="Max Verstappen")
    checo = User(id="Sergio Perez")
    helmut = User(id="Helmut Marko")
    crofty = User(id="Crofty")
    users = [
        toto,
        george,
        lewis,
        christian,
        max,
        checo,
        helmut,
        crofty,
    ]
    for user in users:
        session.add(user)

    ########
    # Orgs #
    ########

    mercedes = Org(
        name="Mercedes",
        billing_address="64 Penny Ln Liverpool, UK",
        base_repo_role="reader",
    )
    redbull = Org(
        name="Red Bull",
        billing_address="123 Scarers Rd Monstropolis, USA",
        base_repo_role="reader",
    )
    orgs = [mercedes, redbull]
    for org in orgs:
        session.add(org)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles.py#L132-L133
    session.flush()
    session.commit()
    # session.close()

    #############
    # Org roles #
    #############

    org_roles = [
        (toto, mercedes, "owner"),
        (george, mercedes, "driver"),
        (lewis, mercedes, "driver"),
        (christian, redbull, "owner"),
        (max, redbull, "driver"),
        (checo, redbull, "driver"),
        (crofty, mercedes, "viewer"),
        (crofty, redbull, "viewer"),
        (helmut, redbull, "viewer")
    ]
    for (user, org, role) in org_roles:
        oso.tell("has_role", user.repr(), role, org.repr())
