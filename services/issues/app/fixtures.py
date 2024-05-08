from collections import OrderedDict
from random import choice, randint
from .models import Issue
from .authorization import oso

from faker import Faker
import faker_microservice

from oso_cloud import Fact

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

    session.query(Issue).delete()

    users = list(range(1, FAKE_USERS + 7))

    ##########
    # Issues #
    ##########

    beatles_members = list(range(1, 5))
    issues = [
        Issue(
            issue_number=1,
            title="Here Comes the Sun",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=2,
            title="Because",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=3,
            title="You Never Give Me Your Money",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=4,
            title="Sun King",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=5,
            title="Mean Mr. Mustard",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=6,
            title="Polythene Pam",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=7,
            title="She Came In Through the Bathroom Window",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=8,
            title="Golden Slumbers",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=9,
            title="Carry That Weight",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=10,
            title="The End",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
        Issue(
            issue_number=11,
            title="Her Majesty",
            repo_id=1,
            creator_id=faker.random_element(beatles_members),
            closed=randint(0, 2) == 0,
        ),
    ]


    ##########
    # Faker  #
    ##########

    for user_id in users:
        repos = oso.list({ "type": "User", "id": str(user_id) }, "read", "Repository")
        for issue_number in range(randint(0, FAKE_ISSUES)):
            issue = Issue(
                issue_number=issue_number,
                title=faker_uniq.sentence(),
                closed=(randint(0, 10) < 2),
                creator_id=user_id,
                repo_id=int(choice(repos)),
            )
            issues.append(issue)

    session.add_all(issues)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles.py#L132-L133
    session.flush()
    session.commit()
    # session.close()
