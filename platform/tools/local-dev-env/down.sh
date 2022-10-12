#!/bin/sh

# Load environment variables
if [ -f .env ]
then
  set -a
  . ../../../.env
  . ./.env
  set +a
fi

down()
{
  SUFFIX=$1
  IGNORE_VOLUMES=$2

  if [ "$IGNORE_VOLUMES" = "true" ]
  then
    VOLUME_ARGS=""
  else
    VOLUME_ARGS=" --volumes"
  fi

  docker-compose -f docker-compose-$SUFFIX.yml -p local-dev-env-$SUFFIX down$VOLUME_ARGS --timeout 0
}

KEEP_VOLUMES="true"

if [ "$DISABLE_GRAFANA" != "true" ]
then
    down "grafana"
fi

if [ "$DISABLE_ELASTIC" = "false" ]
then
    down "elastic" $KEEP_VOLUMES
fi

if [ "$DISABLE_GANACHE" != "true" ]
then
    down "ganache"
fi

down "orchestrate"
down "kafka"
down "deps"
