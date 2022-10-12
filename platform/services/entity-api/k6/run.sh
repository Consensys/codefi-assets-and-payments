#!/bin/sh

# Exit when any command fails
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FILTER="$1"
shift
ARGS=$@

cd "$SCRIPT_DIR"
npm install
cp -r "$SCRIPT_DIR/types"/* node_modules/
npm run build

cd "$SCRIPT_DIR/dist"
SCRIPTS=$(find . -type f -name "$FILTER.js")

for SCRIPT in $SCRIPTS
do
    docker-compose run --rm k6 run "/scripts/$SCRIPT" $ARGS
done
