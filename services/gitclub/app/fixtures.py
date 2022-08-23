from random import choice, randint
from .models import Issue, Organization, Repository, User
from .routes.helpers import oso

from faker import Faker
import faker_microservice

FAKE_USERS = 100
FAKE_ORGANIZATIONS = 10
FAKE_REPOSITORIES = 20
FAKE_ISSUES = 100

def load_fixture_data(session):
    #########
    # Users #
    #########

    faker = Faker()
    Faker.seed(0)
    faker.add_provider(faker_microservice.Provider)
    faker = faker.unique

    session.query(User).delete()
    session.query(Organization).delete()
    session.query(Repository).delete()
    session.query(Issue).delete()

    john = User(username="john", name="John Lennon", email="john@beatles.com")
    paul = User(username="paul", name="Paul McCartney", email="paul@beatles.com")
    admin = User(username="admin", name="admin", email="admin@admin.com")
    mike = User(username="mike", name="Mike Wazowski", email="mike@monsters.com")
    sully = User(username="sully", name="James P Sullivan", email="sully@monsters.com")
    ringo = User(username="ringo", name="Ringo Starr", email="ringo@beatles.com")
    randall = User(username="randall", name="Randall Boggs", email="randall@monsters.com")
    users = [
        john,
        paul,
        admin,
        mike,
        sully,
        ringo,
        randall,
    ]

    for _ in range(FAKE_USERS):
        users.append(User(username=faker.user_name(), name=faker.name(), email=faker.company_email()))

    for user in users:
        session.add(user)

    ########
    # Orgs #
    ########

    beatles = Organization(
        name="The Beatles",
        description="It's The Beatles",
        billing_address="64 Penny Ln Liverpool, UK",
    )
    monsters = Organization(
        name="Monsters Inc.",
        description = "You Won't Believe Your Eye. We Think They Are Scary, But Really We Scare Them!",
        billing_address="123 Scarers Rd Monstropolis, USA",
    )

    orgs = [beatles, monsters]

    for org in orgs:
        session.add(org)


    ########
    # Repos #
    ########

    abbey_road = Repository(name="Abbey Road", org=beatles)
    paperwork = Repository(name="Paperwork", org=monsters)
    repos = [abbey_road, paperwork]

    for repo in repos:
        session.add(repo)

    ##########
    # Issues #
    ##########

    issues = [
        Issue(issue_number=1, title="Here Comes the Sun", repo=abbey_road),
        Issue(issue_number=2, title="Because", repo=abbey_road),
        Issue(issue_number=3, title="You Never Give Me Your Money", repo=abbey_road),
        Issue(issue_number=4, title="Sun King", repo=abbey_road),
        Issue(issue_number=5, title="Mean Mr. Mustard", repo=abbey_road),
        Issue(issue_number=6, title="Polythene Pam", repo=abbey_road),
        Issue(issue_number=7, title="She Came In Through the Bathroom Window", repo=abbey_road),
        Issue(issue_number=8, title="Golden Slumbers", repo=abbey_road),
        Issue(issue_number=9, title="Carry That Weight", repo=abbey_road),
        Issue(issue_number=10, title="The End", repo=abbey_road),
        Issue(issue_number=11, title="Her Majesty", repo=abbey_road)
    ]


    for issue in issues:
        session.add(issue)


    ##########
    # Faker  #
    ##########

    for _ in range(FAKE_ORGANIZATIONS):
        org = Organization(
            name=faker.domain_word(),
            description=faker.catch_phrase(),
            billing_address=faker.address(),
        )
        orgs.append(org)
        session.add(org)

        for _ in range(randint(0, FAKE_REPOSITORIES)):
            repo = Repository(
                name=faker.microservice(),
                org=org,
            )
            repos.append(repo)
            session.add(repo)

            for idx, _ in enumerate(range(randint(0, FAKE_ISSUES))):
                issue = Issue(
                    issue_number=idx,
                    title=faker.sentence(),
                    closed=(randint(0, FAKE_ISSUES) < idx),
                    creator=choice(users),
                    repo=repo,
                )
                issues.append(issue)
                session.add(issue)





    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles.py#L132-L133
    session.flush()
    session.commit()
    # session.close()

    #################
    # Relationships #
    #################

    for repo in repos:
        oso.tell("has_relation", { "type": "Repository", "id": str(repo.id)}, "organization", { "type": "Organization", "id": str(repo.org.id) })
        oso.tell("is_protected", { "type": "Repository", "id": str(repo.id)}, { "type": "Boolean", "id": "false"})

    # for issue in issues:
    #     oso.tell("has_relation", { "type": "Issue", "id": str(issue.id)}, "repository", { "type": "Repository", "id": issue.str(repo.id)})

    ##############
    # Repo roles #
    ##############

    # repo_roles = [
    #     (john, abbey_road, "reader"),
    #     (paul, abbey_road, "reader"),
    #     (ringo, abbey_road, "maintainer"),
    #     (mike, paperwork, "reader"),
    #     (sully, paperwork, "reader"),
    # ]
    # for (user, repo, role) in repo_roles:
    #     oso.tell("has_role", { "type": "User", "id": user.username }, role, { "type": "Repository", "id": str(repo.id) })

    #############
    # Org roles #
    #############

    org_roles = [
        (john, beatles, "admin"),
        (paul, beatles, "member"),
        (ringo, beatles, "member"),
        (mike, monsters, "admin"),
        (sully, monsters, "member"),
        (randall, monsters, "member"),
    ]

    # for user in users:
    #     oso.tell("is_active", { "type": "User", "id": user.username })

    for (user, org, role) in org_roles:
        oso.tell("has_role", { "type": "User", "id": user.username }, role, { "type": "Organization", "id": str(org.id) })
