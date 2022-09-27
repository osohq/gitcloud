.PHONY: test-server

test-server:  require-OSO_AUTH
	yarn start

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))
