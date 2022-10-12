import { group } from 'k6'
import { uuidv4 } from '../utils/uuid'
import * as defaults from '../utils/config'
import {
  createDigitalCurrency,
  waitForOperation,
  getDigitalCurrency,
  mintDigitalCurrency,
} from '../utils/endpoints'
import { getAuthHeaders } from '../utils/auth'
import {getConfigurationOptions} from "../utils/config";

export const options = getConfigurationOptions('Mint')

export function setup() {
  console.log(`${__VU}: Single run: ${defaults.K6.singleRun}`)
  console.log(
    `${__VU}: Environment: ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }`,
  )
  console.log(
    `${__VU}: Sender User Configuration ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.name
    }`,
  )
  console.log(
    `${__VU}: Receiver User Configuration ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver.name
    }`,
  )

  console.log('Setup: fetch auth headers')
  const senderHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.password,
  )

  console.log('Setup: create currency')
  const name = `cur-${uuidv4()}`
  const currency = createDigitalCurrency(
    name,
    name,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].currencyDecimals,
    senderHeaders,
  )

  waitForOperation(currency.operationId, 'confirmed', senderHeaders)

  // Obtain currencyEthereumAddress
  const senderCurrency = getDigitalCurrency(currency.id, senderHeaders)

  // to do : ideally we could type this and the underlying params
  return {
    users: {
      sender: {
        currency: senderCurrency,
        headers: senderHeaders,
      },
    },
  }
}

export default function (params) {
  group('Mint currency', function () {
    const mint = mintDigitalCurrency(
      params.users.sender.currency.id,
      '0x64', // 100
      params.users.sender.currency.deployerAddress,
      params.users.sender.headers,
    )
    waitForOperation(mint.operationId, 'confirmed', params.users.sender.headers)
  })
}
