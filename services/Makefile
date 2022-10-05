
require-%:
	$(if ${${*}},,$(error You must pass the $* environment variable))

publish-subgraphs-prod: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql --routing-url https://gitcloud-gitclub.fly.dev/graphql GitCloud@current
	rover subgraph publish --name jobs --schema jobs/src/schema.graphql --routing-url https://gitcloud-actions.fly.dev/graphql GitCloud@current


publish-subgraphs-supergraph: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql --routing-url https://gitcloud-gitclub.fly.dev/graphql osohq-gitcloud@main
	rover subgraph publish --name jobs --schema jobs/src/schema.graphql --routing-url https://gitcloud-actions.fly.dev/graphql osohq-gitcloud@main

publish-subgraphs: require-APOLLO_KEY
	make -C gitclub publish-subgraph
	rover subgraph publish --name gitclub --schema gitclub/gitclub.graphql --routing-url http://localhost:5000/graphql GitCloud@dev
	rover subgraph publish --name jobs --schema jobs/src/schema.graphql --routing-url http://localhost:5001/graphql GitCloud@dev
