#!/bin/sh

# Exit when any command fails
set -e

# Load environment variables
if [ -f .env ]
then
  set -a
  . ../../../.env
  . ./.env
  set +a
fi

up()
{
  SUFFIX=$1
  LABEL=$2
  M1_OVERRIDE=$3

  echo "Starting $LABEL containers..."

  if [ "$M1" = "true" ] && [ "$M1_OVERRIDE" = "true" ]
  then
    M1_ARGS=" -f m1/docker-compose-$SUFFIX.yml"
  else
    M1_ARGS=""
  fi

  docker-compose -f docker-compose-$SUFFIX.yml$M1_ARGS -p local-dev-env-$SUFFIX up --build -d
}

HAS_M1_OVERRIDES="true"

up "deps" "depdendency"
up "kafka" "Kafka" $HAS_M1_OVERRIDES

if [ "$DISABLE_GANACHE" != "true" ]
then
  up "ganache" "Ganache" $HAS_M1_OVERRIDES
fi

if [ "$DISABLE_ELASTIC" = "false" ]
then
  up "elastic" "Elastic"
fi

if [ "$DISABLE_GRAFANA" != "true" ]
then
  up "grafana" "Grafana"
fi

if [ "$DISABLE_ORCHESTRATE" != "true" ]
then
  up "orchestrate" "Orchestrate" $HAS_M1_OVERRIDES
fi
