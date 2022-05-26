from dataclasses import dataclass
import json

import pytest

from .conftest import test_actions_client, test_gitclub_client

john = "john@beatles.com"
paul = "paul@beatles.com"
ringo = "ringo@beatles.com"
mike = "mike@monsters.com"
sully = "sully@monsters.com"


def test_can_connect(test_gitclub_client):
    resp = test_gitclub_client.get("/session")
    print(resp.json())
    assert resp.status_code == 200
    assert resp.json() in [{}, None]


def test_user_sessions(test_gitclub_client):
    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json() in [{}, None]

    resp = test_gitclub_client.post("/session", json={"id": john})
    assert resp.status_code == 201
    assert resp.json().get("id") == john

    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json().get("id") == john

    resp = test_gitclub_client.delete("/session")
    assert resp.status_code == 204

    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json() in [{}, None]


def test_user_show(test_gitclub_client):
    john_profile = "/users/%s" % john
    resp = test_gitclub_client.get(john_profile)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    print(f"JOHN_PROFILE: {john_profile}")

    resp = test_gitclub_client.get(john_profile)
    assert resp.status_code == 200
    assert resp.json().get("id") == john

    # TODO(gj): doesn't currently work
    # test_gitclub_client.log_in_as(paul)
    #
    # resp = test_gitclub_client.get(john_profile)
    # assert resp.status_code == 403


def test_org_index(test_gitclub_client):
    resp = test_gitclub_client.get("/orgs")
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get("/orgs")
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) == 1
    assert orgs[0]["name"] == "The Beatles"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get("/orgs")
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) == 1
    assert orgs[0]["name"] == "Monsters Inc."


def test_org_create(test_gitclub_client):
    org_name = "new org"
    org_params = {
        "name": org_name,
        "base_repo_role": "member",
        "billing_address": "123 whatever st",
    }
    resp = test_gitclub_client.post("/orgs", json=org_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.post("/orgs", json=org_params)
    assert resp.status_code == 201
    org = resp.json()
    assert org["name"] == org_name

    show_org = "/orgs/%s" % org["id"]
    resp = test_gitclub_client.get(show_org)
    assert resp.status_code == 200


def test_org_show(test_gitclub_client):
    the_beatles = "/orgs/1"
    resp = test_gitclub_client.get(the_beatles)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(the_beatles)
    assert resp.status_code == 200
    org = resp.json()
    assert org["name"] == "The Beatles"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(the_beatles)
    assert resp.status_code == 404


def test_repo_role_choices_index(test_gitclub_client):
    resp = test_gitclub_client.get("/repo_role_choices")
    assert resp.status_code == 200
    repo_role_choices = resp.json()
    assert len(repo_role_choices) == 3
    assert repo_role_choices[0] == "admin"


def test_org_role_choices_index(test_gitclub_client):
    resp = test_gitclub_client.get("/org_role_choices")
    assert resp.status_code == 200
    org_role_choices = resp.json()
    assert org_role_choices == ["member", "owner"]


def test_org_unassigned_users_index(test_gitclub_client):
    resp = test_gitclub_client.get("/orgs/1/unassigned_users")
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get("/orgs/1/unassigned_users")
    assert resp.status_code == 200
    unassigned_users = resp.json()
    assert len(unassigned_users) == 4
    unassigned_ids = [u["id"] for u in unassigned_users]
    assert john not in unassigned_ids
    assert paul not in unassigned_ids
    assert mike in unassigned_ids


def test_org_repo_unassigned_users_index(test_gitclub_client):
    path = "/orgs/1/repos/1/unassigned_users"
    resp = test_gitclub_client.get(path)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(path)
    assert resp.status_code == 200
    unassigned_users = resp.json()
    assert len(unassigned_users) == 4
    unassigned_ids = [u["id"] for u in unassigned_users]
    assert john not in unassigned_ids
    assert paul not in unassigned_ids
    assert ringo not in unassigned_ids
    assert mike in unassigned_ids


def test_org_repo_index(test_gitclub_client):
    beatles_repos = "/orgs/1/repos"
    resp = test_gitclub_client.get(beatles_repos)
    # cannot see org => cannot index repo
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(beatles_repos)
    assert resp.status_code == 200
    repos = resp.json()
    assert len(repos) == 1
    assert repos[0]["name"] == "Abbey Road"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(beatles_repos)
    assert resp.status_code == 404


def test_user_repo_index(test_gitclub_client):
    john_repos = "/users/%s/repos" % john
    resp = test_gitclub_client.get(john_repos)
    # cannot see org => cannot index repo
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(john_repos)
    assert resp.status_code == 200
    repos = resp.json()
    assert len(repos) == 1
    assert repos[0]["name"] == "Abbey Road"

    # if john adds mike to the repo ...
    role_params = {"user_id": mike, "role": "reader"}
    abbey_roles = "/orgs/1/repos/1/role_assignments"
    test_gitclub_client.post(abbey_roles, json=role_params)

    test_gitclub_client.log_in_as(mike)

    # mike can't see john's repos.
    resp = test_gitclub_client.get(john_repos)
    # TODO(gj): broken until we fix OSO-348
    # assert resp.status_code == 403

    # but, mike can see abbey road
    mike_repos = "/users/%s/repos" % mike
    resp = test_gitclub_client.get(mike_repos)
    assert resp.status_code == 200
    repos = [repo["name"] for repo in resp.json()]
    assert len(repos) == 2
    assert "Paperwork" in repos
    assert "Abbey Road" in repos


def test_repo_create(test_gitclub_client):
    repo_params = {"name": "new repo"}
    beatles_repos = "/orgs/1/repos"
    resp = test_gitclub_client.post(beatles_repos, json=repo_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.post(beatles_repos, json=repo_params)
    assert resp.status_code == 201
    repo = resp.json()
    assert repo["name"] == repo_params["name"]

    repo = "%s/%s" % (beatles_repos, repo["id"])
    resp = test_gitclub_client.get(repo)
    assert resp.status_code == 200

    monsters_repos = "/orgs/2/repos"
    resp = test_gitclub_client.post(monsters_repos, json=repo_params)
    assert resp.status_code == 404


def test_repo_show(test_gitclub_client):
    abbey_road = "/orgs/1/repos/1"
    resp = test_gitclub_client.get(abbey_road)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(abbey_road)
    assert resp.status_code == 200
    repo = resp.json()
    assert repo["name"] == "Abbey Road"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(abbey_road)
    assert resp.status_code == 404


def test_issue_index(test_gitclub_client):
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_gitclub_client.get(abbey_road_issues)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(abbey_road_issues)
    assert resp.status_code == 200
    issues = resp.json()
    assert len(issues) == 1
    assert issues[0]["title"] == "Too much critical acclaim"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(abbey_road_issues)
    assert resp.status_code == 404


def test_issue_create(test_gitclub_client):
    issue_params = {"title": "new issue"}
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_gitclub_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 201
    issue = resp.json()
    assert issue["title"] == issue_params["title"]

    paperwork_issues = "/orgs/2/repos/2/issues"
    resp = test_gitclub_client.post(paperwork_issues, json=issue_params)
    assert resp.status_code == 404


def test_issue_close(test_gitclub_client):
    # Logged out user should not be able to close an issue
    too_much_critical_acclaim = "/orgs/1/repos/1/issues/1"
    resp = test_gitclub_client.put(f"{too_much_critical_acclaim}/close")
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    issue_params = {"title": "new issue"}
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_gitclub_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 201
    issue = resp.json()

    # Grant mike a reader role on the abbey road repo
    role_params = {"user_id": mike, "role": "reader"}
    abbey_road_roles = "/orgs/1/repos/1/role_assignments"
    resp = test_gitclub_client.post(abbey_road_roles, json=role_params)
    assert resp.status_code == 201

    test_gitclub_client.log_in_as(mike)

    issue_path = f"/orgs/1/repos/1/issues/{issue['id']}"
    resp = test_gitclub_client.get(issue_path)
    assert resp.status_code == 200

    close_issue_path = f"{issue_path}/close"
    resp = test_gitclub_client.put(close_issue_path)
    assert resp.status_code == 403

    test_gitclub_client.log_in_as(john)
    resp = test_gitclub_client.put(close_issue_path)
    assert resp.status_code == 200


def test_issue_close_as_creator(test_gitclub_client):
    test_gitclub_client.log_in_as(paul)

    # As a reader of abbey road, Paul should not be allowed to close an issue
    too_much_critical_acclaim = "/orgs/1/repos/1/issues/1"
    resp = test_gitclub_client.put(f"{too_much_critical_acclaim}/close")
    assert resp.status_code == 403

    # Paul should be able to create and then close an issue
    issue_params = {"title": "new issue"}
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_gitclub_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 201
    issue = resp.json()

    close_issue_path = f"/orgs/1/repos/1/issues/{issue['id']}/close"
    resp = test_gitclub_client.put(close_issue_path)
    assert resp.status_code == 200


def test_issue_show(test_gitclub_client):
    too_much_critical_acclaim = "/orgs/1/repos/1/issues/1"
    resp = test_gitclub_client.get(too_much_critical_acclaim)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(too_much_critical_acclaim)
    assert resp.status_code == 200
    issue = resp.json()
    assert issue["title"] == "Too much critical acclaim"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(too_much_critical_acclaim)
    assert resp.status_code == 404


def test_org_role_assignment_index(test_gitclub_client):
    beatles_roles = "/orgs/1/role_assignments"
    resp = test_gitclub_client.get(beatles_roles)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(beatles_roles)
    assert resp.status_code == 200
    roles = resp.json()
    assert len(roles) == 3
    john_role = next(r for r in roles if r['user']['id'] == john)
    assert john_role["role"] == "owner"
    ringo_role = next(r for r in roles if r['user']['id'] == ringo)
    assert ringo_role["role"] == "member"

    test_gitclub_client.log_in_as(mike)

    resp = test_gitclub_client.get(beatles_roles)
    assert resp.status_code == 404


def test_org_repo_role_assignment_create(test_gitclub_client):
    role_params = {"user_id": mike, "role": "reader"}
    abbey_roles = "/orgs/1/repos/1/role_assignments"

    # A guest cannot assign a role in any repo.
    resp = test_gitclub_client.post(abbey_roles, json=role_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    # John can assign a new role in the Abbey Road repo.
    resp = test_gitclub_client.post(abbey_roles, json=role_params)
    assert resp.status_code == 201
    user_role = resp.json()
    assert user_role["user"]["id"] == mike
    assert user_role["role"] == role_params["role"]

    # But John can't assign a new role in the Monsters org.
    paperwork_roles = "/orgs/2/repos/2/role_assignments"
    resp = test_gitclub_client.post(paperwork_roles, json=role_params)
    assert resp.status_code == 404


def test_org_role_assignment_create(test_gitclub_client):
    role_params = {"user_id": mike, "role": "member"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot assign a role in any org.
    resp = test_gitclub_client.post(beatles_roles, json=role_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    # John can assign a new role in the Beatles org.
    resp = test_gitclub_client.post(beatles_roles, json=role_params)
    assert resp.status_code == 201
    user_role = resp.json()
    assert user_role["user"]["id"] == mike
    assert user_role["role"] == role_params["role"]

    # But John can't assign a new role in the Monsters org.
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_gitclub_client.post(monsters_roles, json=role_params)
    assert resp.status_code == 404


def test_org_role_assignment_update(test_gitclub_client):
    role_params = {"user_id": paul, "role": "owner"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot update a role in any org.
    resp = test_gitclub_client.patch(beatles_roles, json=role_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    # Paul is currently an 'member' in the Beatles org.
    resp = test_gitclub_client.get(beatles_roles)
    user_roles = resp.json()
    paul_role = next(r for r in user_roles if r['user']['id'] == paul)
    assert paul_role["role"] == "member"

    # John can update Paul's role in the Beatles org.
    resp = test_gitclub_client.patch(beatles_roles, json=role_params)
    assert resp.status_code == 200
    user_role = resp.json()
    assert user_role["user"]["id"] == paul
    assert user_role["role"] == role_params["role"]

    # And Paul is now an 'owner' in the Beatles org.
    resp = test_gitclub_client.get(beatles_roles)
    user_roles = resp.json()
    paul_role = next(
        (ur["role"] for ur in user_roles if ur["user"]["id"] == paul), None
    )
    assert paul_role == "owner"

    # But John can't update a role in the Monsters org.
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_gitclub_client.patch(monsters_roles, json=role_params)
    assert resp.status_code == 404


def test_org_role_assignment_delete(test_gitclub_client):
    paul_role_params = {"user_id": paul, "role": "member"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot delete a role in any org.
    resp = test_gitclub_client.delete(beatles_roles, json=paul_role_params)
    assert resp.status_code == 404

    test_gitclub_client.log_in_as(john)

    # Paul is currently an 'member' in the Beatles org.
    resp = test_gitclub_client.get(beatles_roles)
    user_roles = resp.json()
    paul_role = next(r for r in user_roles if r['user']['id'] == paul)
    assert paul_role["role"] == "member"

    # John can delete Paul's role in the Beatles org.
    resp = test_gitclub_client.delete(beatles_roles, json=paul_role_params)
    assert resp.status_code == 204

    # And Paul no longer has a role in the Beatles org.
    resp = test_gitclub_client.get(beatles_roles)
    user_roles = resp.json()
    paul_role = next(
        (ur["role"] for ur in user_roles if ur["user"]["id"] == paul), None
    )
    assert paul_role is None

    # And John can't delete a role in the Monsters org.
    sully_role_params = {"user_id": sully}
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_gitclub_client.delete(monsters_roles, json=sully_role_params)
    assert resp.status_code == 404


def test_actions(test_actions_client):
    repo1_actions = "/orgs/1/repos/1/actions"

    # List actions w/o logging in
    resp = test_actions_client.get(repo1_actions)
    assert resp.status_code == 404

    # Mike has no role on Repo("1")
    test_actions_client.log_in_as(mike)

    # List actions w/o any role
    resp = test_actions_client.get(repo1_actions)
    assert resp.status_code == 403

    # John has the "reader" role on Repo("1")
    test_actions_client.log_in_as(john)

    # List actions w/ appropriate role
    resp = test_actions_client.get(repo1_actions)
    assert resp.status_code == 200
    assert resp.json() == []

    # Schedule new action
    action_name = "florp"
    action_params = {"name": action_name}
    resp = test_actions_client.post(repo1_actions, json=action_params)
    assert resp.status_code == 201
    action1 = {'id': 1, 'name': action_name, 'creatorId': john, 'repoId': '1', 'status': 'scheduled'}
    assert resp.json() == action1

    # List actions to see newly created one
    resp = test_actions_client.get(repo1_actions)
    assert resp.status_code == 200
    assert resp.json() == [action1]

    # Paul has the "reader" role on Repo("1")
    test_actions_client.log_in_as(paul)

    action1_cancel = repo1_actions + "/1/cancel"

    # Cancel action w/o "the juice"
    resp = test_actions_client.put(action1_cancel)
    assert resp.status_code == 403

    # John is the creator of action 1
    test_actions_client.log_in_as(john)

    # Cancel action w/ "the juice"
    resp = test_actions_client.put(action1_cancel)
    assert resp.status_code == 200
