from .models import Issue, Org, Repo, User
from .routes.helpers import oso


def load_fixture_data(session):
    #########
    # Users #
    #########

    session.query(User).delete()
    session.query(Org).delete()
    session.query(Repo).delete()
    session.query(Issue).delete()

    john = User(id="john@beatles.com")
    paul = User(id="paul@beatles.com")
    admin = User(id="admin@admin.com")
    mike = User(id="mike@monsters.com")
    sully = User(id="sully@monsters.com")
    ringo = User(id="ringo@beatles.com")
    randall = User(id="randall@monsters.com")
    users = [
        john,
        paul,
        admin,
        mike,
        sully,
        ringo,
        randall,
    ]
    for user in users:
        session.add(user)

    ########
    # Orgs #
    ########

    beatles = Org(
        name="The Beatles",
        billing_address="64 Penny Ln Liverpool, UK",
        base_repo_role="reader",
    )
    monsters = Org(
        name="Monsters Inc.",
        billing_address="123 Scarers Rd Monstropolis, USA",
        base_repo_role="reader",
    )
    orgs = [beatles, monsters]
    for org in orgs:
        session.add(org)

    #########
    # Repos #
    #########

    abby_road = Repo(name="Abbey Road", org=beatles)
    paperwork = Repo(name="Paperwork", org=monsters)
    repos = [abby_road, paperwork]
    for repo in repos:
        session.add(repo)

    ##########
    # Issues #
    ##########

    too_much_critical_acclaim = Issue(title="Too much critical acclaim", repo=abby_road)
    issues = [too_much_critical_acclaim]
    for issue in issues:
        session.add(issue)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles.py#L132-L133
    session.flush()
    session.commit()
    # session.close()

    #################
    # Relationships #
    #################

    for repo in repos:
        oso.tell("has_relation", repo, "parent", repo.org)

    for issue in issues:
        oso.tell("has_relation", issue, "parent", issue.repo)

    ##############
    # Repo roles #
    ##############

    repo_roles = [
        (john, abby_road, "reader"),
        (paul, abby_road, "reader"),
        (ringo, abby_road, "maintainer"),
        (mike, paperwork, "reader"),
        (sully, paperwork, "reader"),
    ]
    for (user, repo, role) in repo_roles:
        oso.tell("has_role", user, role, repo)

    #############
    # Org roles #
    #############

    org_roles = [
        (john, beatles, "owner"),
        (paul, beatles, "member"),
        (ringo, beatles, "member"),
        (mike, monsters, "owner"),
        (sully, monsters, "member"),
        (randall, monsters, "member"),
    ]
    for (user, org, role) in org_roles:
        oso.tell("has_role", user, role, org)
