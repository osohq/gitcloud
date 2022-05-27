.PHONY: test-server fixtures start

test-server: node_modules
	yarn link oso-cloud --silent
	yarn ts-node src/index.ts
	yarn unlink oso-cloud --silent

fixtures: node_modules
	yarn link oso-cloud --silent
	yarn fixtures ./fixtures -d --config ./ormconfig.json --sync --require=ts-node/register
	yarn unlink oso-cloud --silent

start: node_modules
	yarn link oso-cloud --silent
	yarn nodemon src/index.ts
	yarn unlink oso-cloud --silent

node_modules: package.json
	yarn
	cd ../../../oso-service/clients/js; yarn link
	@touch $@
