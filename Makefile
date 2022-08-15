test: require-OSO_AUTH
	make test -C tests

update-policy: policy/authorization.polar
	oso-cloud policy policy/authorization.polar

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

.PHONY: test
