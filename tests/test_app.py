from dataclasses import dataclass
import json

import pytest

from .conftest import test_actions_client, test_gitclub_client

john = "john"
paul = "paul"
ringo = "ringo"
mike = "mike"
sully = "sully"


def test_can_connect(test_gitclub_client):
    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json() in [{}, None]


def test_user_sessions(test_gitclub_client):
    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json() in [{}, None]

    resp = test_gitclub_client.post("/session/login", json={"username": john})
    assert resp.status_code == 201
    assert resp.json().get("username") == john

    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json().get("username") == john

    resp = test_gitclub_client.delete("/session/logout")
    assert resp.status_code == 204

    resp = test_gitclub_client.get("/session")
    assert resp.status_code == 200
    assert resp.json() in [{}, None]


def test_user_show(test_gitclub_client):
    john_profile = "/users/%s" % john
    resp = test_gitclub_client.get(john_profile)
    assert resp.status_code == 401

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get(john_profile)
    assert resp.status_code == 200
    assert resp.json().get("username") == john


def test_org_index(test_gitclub_client):
    resp = test_gitclub_client.get("/orgs")
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    test_gitclub_client.log_in_as(john)

    resp = test_gitclub_client.get("/orgs")
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) > 0

