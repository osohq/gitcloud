
require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

publish-subgraphs-prod: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql --routing-url https://gitcloud-gitclub.fly.dev/graphql GitCloud@current

publish-subgraphs: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql --routing-url http://localhost:5000/graphql GitCloud@dev
