import { group } from 'k6'
import { getAuthHeaders } from '../utils/auth'
import * as defaults from '../utils/config'
import { createEntityWallet } from '../utils/endpoints'

import { randomString } from '../utils/utils'
import {getConfigurationOptions} from "../utils/config";

const typeAzureVault = 'INTERNAL_CODEFI_AZURE_VAULT'
const typeHashicorp = 'INTERNAL_CODEFI_HASHICORP_VAULT'

export const options = getConfigurationOptions('CreateWallet')

export function setup() {
  console.log(`${__VU}: Single run: ${defaults.K6.singleRun}`)
  console.log(
    `${__VU}: Environment: ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }`,
  )
  console.log(
    `${__VU}: Sender User configuration: ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.name
    }`,
  )
  console.log(
    `${__VU}: Receiver User configuration: ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver.name
    }`,
  )

  console.log('Setup: fetch auth headers')
  const senderAuthHeader = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.password,
  )

  return {
    users: {
      sender: {
        headers: senderAuthHeader,
      },
    },
  }
}

export default function (params) {
  group('Create wallet', function () {
    // make sure to specify correct wallet type
    createEntityWallet(
      `Test wallet ${randomString()}`,
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender
        .legalEntity,
        typeHashicorp,
      params.users.sender.headers,
    )
  })
}
