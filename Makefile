test: require-OSO_AUTH
	make test -C tests

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

.PHONY: test
