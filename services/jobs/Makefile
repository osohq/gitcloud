.PHONY: test-server

test-server: node_modules require-OSO_AUTH
	yarn link oso-cloud --silent
	yarn ts-node src/index.ts
	yarn unlink oso-cloud --silent

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

node_modules: package.json
	yarn
	cd ../../../oso-service/clients/js; yarn link
	@touch $@
