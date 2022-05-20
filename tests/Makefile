.PHONY: test test-flask-sqlalchemy-oso test-express-typeorm test-flask-sqlalchemy test-rails fmt

TEST_FLAGS ?=

test: test-flask-sqlalchemy test-flask-sqlalchemy-oso test-rails test-express-typeorm

# TODO better name
test-flask-sqlalchemy-oso: venv
	. venv/bin/activate; BACKEND=library/flask-sqlalchemy-oso pytest ${TEST_FLAGS}

test-express-typeorm: venv
	. venv/bin/activate; BACKEND=library/express-typeorm pytest ${TEST_FLAGS}

test-flask-sqlalchemy: venv
	. venv/bin/activate; BACKEND=library/flask-sqlalchemy pytest ${TEST_FLAGS}

test-rails: venv
	. venv/bin/activate; BACKEND=library/rails pytest ${TEST_FLAGS}

test-cloud: venv
	. venv/bin/activate; BACKEND=cloud/flask-sqlalchemy pytest ${TEST_FLAGS}

test-oso-cloud:
	cd ../../oso-service; cargo run -- run --test-mode

fmt: venv
	. venv/bin/activate; black .

venv: venv/touchfile

venv/touchfile: requirements.txt
	test -d venv || python3 -m venv venv
	. venv/bin/activate; pip install -r requirements.txt
	touch $@
