test: require-OSO_AUTH
	make test -C tests

test-policy: require-OSO_AUTH
	@make test -C policy

update-policy: policy/authorization.polar
	oso-cloud policy policy/authorization.polar

require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

setup:
	make setup -C policy

.PHONY: setup test test-policy
