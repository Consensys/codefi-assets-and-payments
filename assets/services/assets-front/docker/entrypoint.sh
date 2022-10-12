#!/bin/sh

set -ex

replace_var() {
    # $1 var name
    # $2 file name
    eval "value=\$$1"
    if [ -z "$value" ]; then
        echo "WARN: Undefined variable $1"
        sed -i "s,%$1%,,g" $2
    else
        echo "Setting variable $1"
        sed -i "s,%$1%,$value,g" $2
    fi
}

if [[ "$@" = 'nginx-fe' ]]; then

    # go through all JS files and replace %VAR_NAME% with VAR_NAME value from env variables
    find /var/www/app -type f -name "*.js" | while read filename; do
        replace_var REACT_APP_DOMAIN_NAME $filename
        replace_var REACT_APP_AUTH_CLIENT_ID $filename
        replace_var REACT_APP_AUTH_DOMAIN $filename
        replace_var REACT_APP_AUTH_AUDIENCE $filename
        replace_var REACT_APP_APP_URL $filename
        replace_var REACT_APP_CBDC_BASE_URL $filename
        replace_var REACT_APP_ZENDESK_KEY $filename
        replace_var REACT_APP_ENABLE_APM $filename
        replace_var REACT_APP_ELASTIC_APM_SERVER_URL $filename
        replace_var REACT_APP_MAINTENANCE_MODE $filename
    done

    exec nginx -g "daemon off;"
fi

exec "$@"
