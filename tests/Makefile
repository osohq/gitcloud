.PHONY: test test-oso-cloud fmt

TEST_FLAGS ?=

test: venv require-OSO_AUTH
	. venv/bin/activate; pytest ${TEST_FLAGS}

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

fmt: venv
	. venv/bin/activate; black .

venv: venv/touchfile

venv/touchfile: requirements.txt
	test -d venv || python3 -m venv venv
	. venv/bin/activate; pip install -r requirements.txt
	touch $@
