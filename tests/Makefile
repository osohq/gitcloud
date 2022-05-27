.PHONY: test test-oso-cloud fmt

TEST_FLAGS ?=

test: venv
	. venv/bin/activate; pytest ${TEST_FLAGS}

test-oso-cloud:
	cd ../../oso-service; cargo run -- run --test-mode

fmt: venv
	. venv/bin/activate; black .

venv: venv/touchfile

venv/touchfile: requirements.txt
	test -d venv || python3 -m venv venv
	. venv/bin/activate; pip install -r requirements.txt
	touch $@
