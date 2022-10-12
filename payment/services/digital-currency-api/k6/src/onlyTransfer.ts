import { group } from 'k6'
import { uuidv4 } from '../utils/uuid'
import * as defaults from '../utils/config'

import {
  getLegalEntity,
  waitForOperation,
  getDigitalCurrency,
  mintDigitalCurrency,
  createDigitalCurrency,
  transferDigitalCurrency,
} from '../utils/endpoints'
import { getAuthHeaders } from '../utils/auth'

import {
  getEthAddressBalanceList,
  getCurrentEthAddressBalance,
} from '../utils/utils'
import { getConfigurationOptions } from '../utils/config'

export const options = getConfigurationOptions('onlyTransfer')

export function setup() {
  console.log(`${__VU}: Single Run ${defaults.K6.singleRun}`)
  console.log(
    `${__VU}: Environment ${
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
  const receiverHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .password,
  )

  const senderHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.password,
  )

  console.log('Setup: fetch legal entity')
  const senderLegalEntity = getLegalEntity(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender
      .legalEntity,
    senderHeaders,
  )

  const receiverLegalEntity = getLegalEntity(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .legalEntity,
    senderHeaders,
  )

  console.log('Setup: create currency')
  const name = `cur-${uuidv4()}`
  const currency = createDigitalCurrency(
    name,
    name,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].currencyDecimals,
    senderHeaders,
  )

  console.log(
    `Setup: Wait for currency creation confirmation for currencyID : ${currency.id}, operationID: ${currency.operationId}`,
  )
  waitForOperation(currency.operationId, 'confirmed', senderHeaders)
  // Obtain currencyEthereumAddress
  const senderCurrency = getDigitalCurrency(currency.id, senderHeaders)

  console.log('Setup: mint currency')
  const mint = mintDigitalCurrency(
    senderCurrency.id,
    '0x174876e800', // 100 billions
    senderCurrency.deployerAddress,
    senderHeaders,
  )
  waitForOperation(mint.operationId, 'confirmed', senderHeaders)

  const ethAddressBalance = getEthAddressBalanceList(defaults.K6.vus)

  // to do : ideally we could type this and the underlying params
  return {
    users: {
      ethAddressBalance: ethAddressBalance,
      sender: {
        currency: senderCurrency,
        headers: senderHeaders,
        entity: senderLegalEntity,
      },
      receiver: {
        headers: receiverHeaders,
        entity: receiverLegalEntity,
      },
    },
  }
}

export default function (params) {
  const amount = '0x32' // 50

  group('Sender: transfer currency', function () {
    transferDigitalCurrency(
      params.users.sender.currency.id,
      amount,
      params.users.receiver.entity.ethereumAddress,
      params.users.sender.headers,
    )
  })
}
