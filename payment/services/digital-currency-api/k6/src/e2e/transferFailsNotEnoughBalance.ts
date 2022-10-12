import { check, group } from 'k6'
import { uuidv4 } from '../../utils/uuid'
import * as defaults from '../../utils/config'
import {
  getLegalEntity,
  waitForOperation,
  getDigitalCurrency,
  mintDigitalCurrency,
  createDigitalCurrency,
  createEntityWallet,
  getCurrencyHolderBalanceBlockchain,
} from '../../utils/endpoints'
import { getAuthHeaders } from '../../utils/auth'
import { randomString } from '../../utils/utils'
import {
  transferDigitalCurrencyBatch,
  waitForOperationsConfirmedBatch,
} from '../../utils/batchEndpoints'

export const options = {
  // 36 000 transactions ~ 1hour with 10 tps
  operationsAmount: __ENV.OPERATIONS_AMOUNT || '10',
  statusCheckTimeoutS: __ENV.STATUS_CHECK_TIMEOUT_S || '180', // in seconds
  // option1: INTERNAL_CODEFI_HASHICORP_VAULT - oat; uat
  // option2: INTERNAL_CODEFI_AZURE_VAULT - uat
  // option3: INTERNAL_CLIENT_AZURE_VAULT - prod
  walletType: 'INTERNAL_CODEFI_HASHICORP_VAULT', // make sure to specify correct wallet type
  transferAmount: 10, // how many digital assets should be sent
  duration: '6h', // max duration(timeout) for whole e2e test
  setupTimeout: '1h', // max duration(timeout) for setup only
  iterations: 1,
  thresholds: {
    'group_duration{group:::setup}': ['max>=0'],
    'http_reqs{group:::setup}': [`count>=0`],
    'group_duration{group:::Sender: transfer currencies}': ['max>=0'],
    'http_reqs{group:::Sender: transfer currencies}': [`count>=0`],
    'group_duration{group:::Check transfer statuses confirmed}': ['max>=0'],
    'http_reqs{group:::Check transfer statuses confirmed}': [`count>=0`],
    'group_duration{group:::Check holders balances}': ['max>=0'],
    'http_reqs{group:::Check holders balances}': [`count>=0`],
  },
}

const timeoutDelegate = (startTime: number) => {
  const statusCheckTimeoutSNumber: number = parseInt(
    options.statusCheckTimeoutS,
    10,
  )

  return (cb: Function) => {
    if (new Date().getTime() - startTime > 1000 * statusCheckTimeoutSNumber) {
      console.log(`Reached timeout in ${options.statusCheckTimeoutS} second(s)`)
      cb()
    }
  }
}

const transferAmountHex = `0x${options.transferAmount.toString(16)}`

export function setup() {
  console.log(
    `${__VU}: Environment ${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }`,
  )
  console.log(`Operations amount : ${options.operationsAmount}`)
  console.log(`Status check timeout(s) : ${options.statusCheckTimeoutS}`)
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

  console.log('Setup: Sender. Fetch auth headers')
  const senderHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender.password,
  )

  console.log('Setup: Receiver. Fetch auth headers')
  const receiverHeaders = getAuthHeaders(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .username,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .password,
  )

  console.log('Setup: Sender. Fetch legal entity')
  const senderLegalEntity = getLegalEntity(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.sender
      .legalEntity,
    senderHeaders,
  )

  console.log('Setup: Receiver. Fetch legal entity')
  const receiverLegalEntity = getLegalEntity(
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .legalEntity,
    receiverHeaders,
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
  const mintedAmountHex = `0x${(
    parseInt(options.operationsAmount, 10) * options.transferAmount
  ).toString(16)}`

  const mint = mintDigitalCurrency(
    senderCurrency.id,
    mintedAmountHex,
    senderCurrency.deployerAddress,
    senderHeaders,
  )
  waitForOperation(mint.operationId, 'confirmed', senderHeaders)

  console.log('Setup: create receiver wallet')
  const { walletAddress } = createEntityWallet(
    `Test wallet ${randomString()}`,
    defaults.ENVIRONMENT.ALL[defaults.K6.environment].testUsers.receiver
      .legalEntity,
    options.walletType,
    receiverHeaders,
  )

  return {
    sender: {
      currency: senderCurrency,
      headers: senderHeaders,
      entity: senderLegalEntity,
      mintedAmountHex,
    },
    receiver: {
      walletAddress,
      entity: receiverLegalEntity,
      headers: receiverHeaders,
    },
  }
}

export default function (params) {
  let transferIds: string[] = []
  let confirmedTransfersAmount = 0
  const twoOperationsShouldFail = 2
  const moreOperationsThanBalance =
    parseInt(options.operationsAmount, 10) + twoOperationsShouldFail // not enough balance for the 2 extra operations

  group('Sender: transfer currencies', function () {
    // Send a batch of transfers
    transferIds = transferDigitalCurrencyBatch(
      params.sender.currency.id,
      transferAmountHex,
      params.receiver.walletAddress,
      moreOperationsThanBalance,
      params.sender.headers,
    )
  })

  group('Check transfer statuses confirmed', function () {
    confirmedTransfersAmount = waitForOperationsConfirmedBatch(
      transferIds,
      params.sender.headers,
      timeoutDelegate(new Date().getTime()),
      false,
    )
    console.log(`Confirmed transfers amount: ${confirmedTransfersAmount}`)
    check(confirmedTransfersAmount, {
      'Failed transfers amount == 2': (confirmed) => confirmed === transferIds.length - 2,
    })
  })

  const mintedBalance = parseInt(params.sender.mintedAmountHex, 16)
  const transferAmount = parseInt(transferAmountHex, 16)
  const transferredAmount = confirmedTransfersAmount * transferAmount

  group('Sender: check holder balance', function () {
    const holder = getCurrencyHolderBalanceBlockchain(
      params.sender.entity.ethereumAddress,
      params.sender.currency.currencyEthereumAddress,
      params.sender.entity.orchestrateChainName,
      params.sender.headers,
    )
    const balance = parseInt(holder.balance, 16)
    const expectedBalance = mintedBalance - transferredAmount
    console.log(
      `Sender balance is: ${holder.balance}(${balance}); expected -> ${expectedBalance}`,
    )

    check(holder, {
      'Sender: correct balance': () => balance === expectedBalance,
    })
  })

  group('Receiver: check holder balance', function () {
    const holder = getCurrencyHolderBalanceBlockchain(
      params.receiver.walletAddress,
      params.sender.currency.currencyEthereumAddress,
      params.receiver.entity.orchestrateChainName,
      params.receiver.headers,
    )
    const balance = parseInt(holder.balance, 16)
    console.log(
      `Receiver balance is: ${holder.balance}(${balance}); expected -> ${transferredAmount}`,
    )
    console.log(
      `Receiver entity.ethereumAddress: ${params.receiver.entity.ethereumAddress}`,
    )

    check(holder, {
      'Receiver: correct balance': () => balance === transferredAmount,
    })
  })
}
