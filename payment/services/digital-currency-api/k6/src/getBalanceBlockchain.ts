import { check, group } from 'k6'
import { uuidv4 } from '../utils/uuid'
import * as defaults from '../utils/config'
import {
  getLegalEntity,
  waitForOperation,
  getDigitalCurrency,
  mintDigitalCurrency,
  createDigitalCurrency,
  getCurrencyHolderBalanceBlockchain,
} from '../utils/endpoints'

import { getAuthHeaders } from '../utils/auth'
import { getConfigurationOptions } from '../utils/config'

const walletBalance = '0x174876e800' // 100 billions

export const options = getConfigurationOptions(
  'Get Balance directly from the blockchain',
)

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

  waitForOperation(currency.operationId, 'confirmed', senderHeaders)
  // Obtain currencyEthereumAddress
  const senderCurrency = getDigitalCurrency(currency.id, senderHeaders)

  console.log('Setup: mint currency')
  const mint = mintDigitalCurrency(
    senderCurrency.id,
    walletBalance,
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
    },
  }
}

export default function (params) {
  group('Sender: check holder balance', function () {
    const holder = getCurrencyHolderBalanceBlockchain(
      params.users.sender.entity.ethereumAddress,
      params.users.sender.currency.currencyEthereumAddress,
      params.users.sender.entity.orchestrateChainName,
      params.users.sender.headers,
    )
    console.log(`Holder balance: ${holder.balance}  - wallet: ${walletBalance}`)

    check(holder, {
      'Sender: correct balance': (holder) =>
        parseInt(holder.balance, 16) === parseInt(walletBalance, 16),
    })
  })
}
