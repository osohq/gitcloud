
require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

publish-subgraphs: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql GitCloud@current