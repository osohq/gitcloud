.PHONY: run test-server fmt

run: venv
	. venv/bin/activate; flask run

test-server: venv
	. venv/bin/activate; FLASK_APP="app:create_app('sqlite://', True)" flask run

fmt: venv
	. venv/bin/activate; black .

venv: venv/touchfile

venv/touchfile: requirements.txt
	test -d venv || python3 -m venv venv
	. venv/bin/activate; pip install -r requirements.txt
	touch $@
