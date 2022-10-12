#!/bin/bash

export this_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export AWS_DEFAULT_REGION='eu-west-3'

# When this runs in gitlab-runner, use AWS env vars in https://gitlab.com/groups/consensys-defi/-/settings/ci_cd instead of AWS_PROFILE.
if [[ -z $AWS_ACCESS_KEY_ID ]]; then 
  export AWS_PROFILE='codefi'
fi

export KUBECONFIG="${this_dir}/kubeconfig"
export NAMESPACE="default"
export DOMAIN_NAME="codefi.network"

if [[ $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "master" ]]; then
  echo "This is a merge request"
  export URL_PATH="${CI_COMMIT_SHORT_SHA}/"
else
  echo "This is not a merge request, we do nothing"
fi

kubectl config set-context --current --namespace=$NAMESPACE

# Helm repos
helm repo add bitnami https://charts.bitnami.com/bitnami
