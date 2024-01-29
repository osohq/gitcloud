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


def limit_bulk_tell(facts, bulk_limit=20):
    start_index = 0
    end_index = min(len(facts), bulk_limit)
    total_facts_added = 0
    total_number_facts = len(facts)
    while start_index < total_number_facts:
        oso_response = oso.bulk_tell(facts=facts[start_index:end_index])
        if oso_response != None:
            print(
                "An issue occurred adding facts {} - {})".format(start_index, end_index)
            )
        else:
            total_facts_added += end_index - start_index

        start_index = end_index
        end_index = start_index + min(total_number_facts - start_index, bulk_limit)

    if total_facts_added == total_number_facts:
        print(
            "All {} facts were successfully added to Oso Cloud!".format(
                total_facts_added
            )
        )
    else:
        print(
            "An error occurred. Not all facts were properly uploaded ({} of {}).".format(
                total_facts_added, total_number_facts
            )
        )


def load_fixture_data(session):
    #########
    # Users #
    #########

    faker = Faker()
    Faker.seed(0)
    faker.add_provider(faker_microservice.Provider)
    faker_uniq = faker.unique

    session.query(Issue).delete()

    deletions: list[Fact] = []
    facts: list[Fact] = []

    john = "john"
    paul = "paul"
    george = "george"
    mike = "mike"
    sully = "sully"
    ringo = "ringo"
    randall = "randall"

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

    for issue in issues:
        session.add(issue)

    ##########
    # Faker  #
    ##########

    for org_id in range(FAKE_ORGANIZATIONS):
        for repo_id in range(
            randint(
                org_id * FAKE_REPOSITORIES,
                org_id * FAKE_REPOSITORIES + FAKE_REPOSITORIES,
            )
        ):
            for idx, _ in enumerate(range(randint(0, FAKE_ISSUES))):
                issue = Issue(
                    issue_number=idx,
                    title=faker_uniq.sentence(),
                    closed=(randint(0, FAKE_ISSUES) < idx),
                    creator_id=choice(users),
                    repo_id=repo_id,
                )
                issues.append(issue)
                session.add(issue)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles.py#L132-L133
    session.flush()
    session.commit()
    # session.close()

    deletions.append(
        {
            "name": "has_relation",
            "args": [{"type": "Issue"}, "repository", {"type": "Repository"}],
        }
    )
    deletions.append(
        {
            "name": "has_relation",
            "args": [{"type": "Issue"}, "creator", {"type": "User"}],
        }
    )
    for issue in issues:
        facts.append(
            {
                "name": "has_relation",
                "args": [
                    {"type": "Issue", "id": str(issue.id)},
                    "repository",
                    {"type": "Repository", "id": str(issue.repo_id)},
                ],
            }
        )
        facts.append(
            {
                "name": "has_relation",
                "args": [
                    {"type": "Issue", "id": str(issue.id)},
                    "creator",
                    {"type": "User", "id": str(issue.creator_id)},
                ],
            }
        )

    oso.bulk(deletions, [])
    for idx in range(0, len(facts), 20):
        print(oso.bulk_tell(facts=facts[idx : idx + 20]))

    session.flush()
    session.commit()
