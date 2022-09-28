from collections import OrderedDict
from random import choice, randint
from .models import Issue, OrgRole, RepoRole, Organization, Repository, User
from .routes.helpers import oso

from faker import Faker
import faker_microservice

from typing import Any

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
    faker_uniq = faker.unique

    session.query(User).delete()
    session.query(Organization).delete()
    session.query(Repository).delete()
    session.query(Issue).delete()

    facts: list[Any] = [] # temporary

    john = User(username="john", name="John Lennon", email="john@beatles.com")
    paul = User(username="paul", name="Paul McCartney", email="paul@beatles.com")
    george = User(username="george", name="George Harrison", email="george@beatles.com")
    admin = User(username="admin", name="admin", email="admin@admin.com")
    mike = User(username="mike", name="Mike Wazowski", email="mike@monsters.com")
    sully = User(username="sully", name="James P Sullivan", email="sully@monsters.com")
    ringo = User(username="ringo", name="Ringo Starr", email="ringo@beatles.com")
    randall = User(username="randall", name="Randall Boggs", email="randall@monsters.com")
    users = [
        john,
        paul,
        george,
        admin,
        mike,
        sully,
        ringo,
        randall,
    ]

    for _ in range(FAKE_USERS):
        users.append(User(username=faker_uniq.user_name(), name=faker_uniq.name(), email=faker_uniq.company_email()))

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

    abbey_road = Repository(name="Abbey Road", org=beatles, description="In the end, the love you take is equal to the love you make", public=True)
    paperwork = Repository(name="Paperwork", org=monsters, description="Oh, that darn paperwork! Wouldn't it be easier if it all just blew away?")
    repos = [abbey_road, paperwork]

    for repo in repos:
        session.add(repo)

    ##########
    # Issues #
    ##########

    beatles_members = [john, ringo, paul, george]
    issues = [
        Issue(issue_number=1, title="Here Comes the Sun", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=2, title="Because", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=3, title="You Never Give Me Your Money", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=4, title="Sun King", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=5, title="Mean Mr. Mustard", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=6, title="Polythene Pam", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=7, title="She Came In Through the Bathroom Window", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=8, title="Golden Slumbers", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=9, title="Carry That Weight", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=10, title="The End", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
        Issue(issue_number=11, title="Her Majesty", repo=abbey_road, creator=faker.random_element(beatles_members), closed=randint(0, 2) == 0),
    ]


    for issue in issues:
        session.add(issue)


    ##########
    # Faker  #
    ##########

    for _ in range(FAKE_ORGANIZATIONS):
        org = Organization(
            name=faker_uniq.domain_word(),
            description=faker_uniq.catch_phrase(),
            billing_address=faker_uniq.address(),
        )
        orgs.append(org)
        session.add(org)

        for _ in range(randint(0, FAKE_REPOSITORIES)):
            repo = Repository(
                name=faker_uniq.microservice(),
                org=org,
                description=faker_uniq.bs(),
                public=(randint(0, 10) < 1),
                protected=(randint(0, 20) < 1),
            )
            repos.append(repo)
            session.add(repo)

            for idx, _ in enumerate(range(randint(0, FAKE_ISSUES))):
                issue = Issue(
                    issue_number=idx,
                    title=faker_uniq.sentence(),
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
        facts.append(["has_relation", { "type": "Repository", "id": str(repo.id)}, "organization", { "type": "Organization", "id": str(repo.org.id) }])
        facts.append(["is_protected", { "type": "Repository", "id": str(repo.id)}, { "type": "Boolean", "id": str(repo.protected).lower()}])
        if repo.public:
            facts.append(["is_public", { "type": "Repository", "id": str(repo.id)}])

    # for issue in issues:
    #     facts.append(["has_relation", { "type": "Issue", "id": str(issue.id)}, "repository", { "type": "Repository", "id": issue.str(repo.id)}])

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
    #     facts.append(["has_role", { "type": "User", "id": user.username }, role, { "type": "Repository", "id": str(repo.id) }])

    #############
    # Org roles #
    #############

    org_roles = [
        OrgRole(user_id=john.username, org_id=beatles.id, role="admin"),
        OrgRole(user_id=paul.username, org_id=beatles.id, role="member"),
        OrgRole(user_id=ringo.username, org_id=beatles.id, role="member"),
        OrgRole(user_id=george.username, org_id=beatles.id, role="member"),
        OrgRole(user_id=mike.username, org_id=monsters.id, role="admin"),
        OrgRole(user_id=sully.username, org_id=monsters.id, role="member"),
        OrgRole(user_id=randall.username, org_id=monsters.id, role="member"),
    ]

    org_role_choices = OrderedDict([
        ("admin", 0.1), 
        ("member", 0.9), 
    ])

    ### Faker Org Roles
    for org in orgs[2:]:
        admin = faker.random_element(elements=users)
        org_roles.append(
            OrgRole(user_id=admin.username, org_id=org.id, role="admin")
        )
        org_users = faker.random_elements(elements=users, length=randint(1, 10), unique=True)
        for user in org_users:
            org_roles.append(
                OrgRole(user_id=user.username, org_id=org.id, role=faker.random_element(org_role_choices))
            )

    for org_role in org_roles:
        session.add(org_role)
        facts.append(["has_role", { "type": "User", "id": org_role.user_id }, org_role.role, { "type": "Organization", "id": str(org_role.org_id) }])

    repo_roles = []

    repo_role_choices = OrderedDict([
        ("editor", 0.5), 
        ("maintainer", 0.5), 
    ])
    for repo in repos[2:]:
        repo_users = faker.random_elements(elements=users, length=randint(0, 4), unique=True)
        for user in repo_users:
            repo_roles.append(
                RepoRole(user_id=user.username, repo_id=repo.id, role=faker.random_element(repo_role_choices))
            )

    for repo_role in repo_roles:
        session.add(repo_role)
        facts.append(["has_role", { "type": "User", "id": repo_role.user_id }, repo_role.role, { "type": "Repository", "id": str(repo_role.repo_id) }])


    print(oso.bulk_tell(facts=facts))
    session.flush()
    session.commit()
