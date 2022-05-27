import subprocess
import signal
import socket
import pytest
from time import sleep
import requests
from functools import partial
import os


def PrefixUrlSession(prefix=None):
    """
    This is just like a normal requests.Session, but the given prefix is
    prepended to each request URL.
    """
    if prefix is None:
        prefix = ""
    else:
        prefix = prefix.rstrip("/") + "/"

    def new_request(prefix, f, method, url, *args, **kwargs):
        return f(method, prefix + url.lstrip("/"), *args, **kwargs)

    s = requests.Session()
    s.request = partial(new_request, prefix, s.request)
    return s


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        result = sock.connect_ex(("127.0.0.1", port))
        return result == 0


def ensure_port_is_open(process, port):
    interval = 0.5
    elapsed = interval
    sleep(interval)
    while not is_port_open(port):
        sleep(interval)
        process.poll()
        if process.returncode is not None:
            raise RuntimeError(
                f"Server died before port {port} was opened. Check the output above to see why."
            )
        elapsed += interval
        if elapsed > 60:
            raise RuntimeError(
                f"Server took more than 60s to start listening on port {port}, aborting."
            )


@pytest.fixture(scope="session")
def test_gitclub(test_oso_cloud):
    process = subprocess.Popen(
        ["make", "test-server", "-C", "../services/gitclub"], start_new_session=True
    )
    ensure_port_is_open(process, 5000)
    print("Test GitClub spun up")
    yield process
    pgrp = os.getpgid(process.pid)
    os.killpg(pgrp, signal.SIGINT)
    process.wait()
    print("Test GitClub spun down")


@pytest.fixture(scope="session")
def test_actions_service(test_oso_cloud):
    process = subprocess.Popen(
        ["make", "test-server", "-C", "../services/actions"], start_new_session=True
    )
    ensure_port_is_open(process, 5001)
    print("Test Actions Service spun up")
    yield process
    pgrp = os.getpgid(process.pid)
    os.killpg(pgrp, signal.SIGINT)
    process.wait()
    print("Test Actions Service spun down")


@pytest.fixture(scope="session")
def test_oso_cloud():
    process = subprocess.Popen(["make", "test-oso-cloud"], start_new_session=True)
    ensure_port_is_open(process, 8080)
    print("Test Oso Cloud spun up")
    yield process
    pgrp = os.getpgid(process.pid)
    os.killpg(pgrp, signal.SIGINT)
    process.wait()
    print("Test Oso Cloud spun down")


@pytest.fixture
def test_gitclub_client(test_gitclub):
    with PrefixUrlSession("http://localhost:5000") as session:

        def log_in_as(id: str):
            session.post("/session", json={"id": id})

        session.log_in_as = log_in_as  # type: ignore
        session.post("/_reset")

        yield session


@pytest.fixture
def test_actions_client(test_actions_service):
    with PrefixUrlSession("http://localhost:5001") as session:

        def log_in_as(id: str):
            session.headers["USER"] = id

        session.log_in_as = log_in_as  # type: ignore
        session.post("/_reset")

        yield session
