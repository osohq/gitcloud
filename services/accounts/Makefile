.PHONY: test-server run fmt

test-server: venv
	. venv/bin/activate; FLASK_APP="app:create_app('sqlite://', True)" flask run

run: venv
	. venv/bin/activate; flask run

fmt: venv
	. venv/bin/activate; black .

mypy: venv
	. venv/bin/activate; mypy app

venv: venv/touchfile

venv/touchfile: requirements.txt
	test -d venv || python3 -m venv venv
	. venv/bin/activate; pip install -r requirements.txt
	touch $@

publish-subgraph: venv
	. venv/bin/activate; OSO_AUTH="123" strawberry export-schema app.schema > gitclub.graphql

docker-generate-data:
	docker-compose exec -e FLASK_APP="app:create_app(load_fixtures=True)" -w "/app" accounts flask run
	cd ../oso && ./oso-sync.sh