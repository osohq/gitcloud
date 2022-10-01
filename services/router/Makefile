require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

run: require-APOLLO_KEY
	APOLLO_GRAPH_REF="GitCloud@dev" router -c router.yaml 