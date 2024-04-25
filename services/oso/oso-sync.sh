#! /bin/bash

docker-compose exec oso /home/app/.local/bin/oso-cloud experimental reconcile --perform-updates /app/facts.yml
