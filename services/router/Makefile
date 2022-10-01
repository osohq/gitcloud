require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

deps-check:
	@which router || (echo "router is not installed. See https://www.apollographql.com/docs/router/quickstart#download-options" && exit 1)

run: require-APOLLO_KEY deps-check
	APOLLO_GRAPH_REF="GitCloud@dev" router -c router.yaml 