import { check, group } from 'k6'
import { uuidv4 } from '../utils/uuid'
import * as defaults from '../utils/config'
import {
  getLegalEntity,
  waitForOperation,
  getDigitalCurrency,
  mintDigitalCurrency,
  createDigitalCurrency,
  transferDigitalCurrency,
  getCurrencyHolderBalanceBlockchain,
} from '../utils/endpoints'

import { getAuthHeaders } from '../utils/auth'
import { getConfigurationOptions } from '../utils/config'

export const options = getConfigurationOptions('Transfer')

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
  const senderHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.password,
  )
  const receiverHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .password,
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

  // to do : ideally we could type this and the underlying params
  return {
    users: {
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
  const name = `cur-${uuidv4()}`

  group('Sender: create currency', function () {
    const currency = createDigitalCurrency(
      name,
      name,
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].currencyDecimals,
      params.users.sender.headers,
    )
    waitForOperation(
      currency.operationId,
      'confirmed',
      params.users.sender.headers,
    )
  })

  group('Sender: tranfer currency', function () {
    const transfer = transferDigitalCurrency(
      params.users.sender.currency.id,
      '0x64',
      params.users.receiver.entity.ethereumAddress,
      params.users.sender.headers,
    )
    waitForOperation(
      transfer.operationId,
      'confirmed',
      params.users.sender.headers,
    )
  })

  group('Sender: check holder balance', function () {
    const holder = getCurrencyHolderBalanceBlockchain(
      params.users.sender.entity.ethereumAddress,
      params.users.sender.currency.currencyEthereumAddress,
      params.users.sender.entity.orchestrateChainName,
      params.users.sender.headers,
    )
    check(holder, {
      'Sender: empty balance': (h) => h.balance !== '0x0',
    })
  })

  group('Receiver: check holder balance', function () {
    const holder = getCurrencyHolderBalanceBlockchain(
      params.users.receiver.entity.ethereumAddress,
      params.users.sender.currency.currencyEthereumAddress,
      params.users.sender.entity.orchestrateChainName,
      params.users.receiver.headers,
    )
    check(holder, {
      'Receiver: correct balance': (h) => h.balance !== '0x0',
    })
  })
}
