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

import {
  getEthAddressBalanceList,
  getCurrentEthAddressBalance,
  updateCurrentEthAddressBalance,
} from '../utils/utils'
import { getConfigurationOptions } from '../utils/config'

export const options = getConfigurationOptions('Transfer2')

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

  console.log('Setup: fetch legal entity')
  const senderLegalEntity = getLegalEntity(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender
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

  const ethAddressBalance = getEthAddressBalanceList(defaults.K6.persistentLoadMaxVUs)

  // to do : ideally we could type this and the underlying params
  return {
    users: {
      ethAddressBalance: ethAddressBalance,
      sender: {
        currency: senderCurrency,
        headers: senderHeaders,
        entity: senderLegalEntity,
      },
    },
  }
}

export default function (params) {
  const amount = '0x64' // 100
  const { ethereumAddress, balance } = getCurrentEthAddressBalance(
    params.users.ethAddressBalance,
  )

  group('Sender: transfer currency', function () {
    const transfer = transferDigitalCurrency(
      params.users.sender.currency.id,
      amount,
      ethereumAddress,
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
      ethereumAddress,
      params.users.sender.currency.currencyEthereumAddress,
      params.users.sender.entity.orchestrateChainName,
      params.users.sender.headers,
    )

    check(holder, {
      'Sender: correct balance': (h) =>
        parseInt(h.balance, 16) - parseInt(balance, 16) ===
        parseInt(amount, 16),
    })
    updateCurrentEthAddressBalance(
      params.users.ethAddressBalance,
      holder.balance,
    )
  })
}
