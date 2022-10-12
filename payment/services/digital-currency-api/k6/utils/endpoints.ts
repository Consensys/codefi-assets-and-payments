import { check, sleep, JSONArray, fail } from 'k6'
import http from 'k6/http'
import { Params } from 'k6/http'
import * as defaults from './config'

function getOperationStatus(operationId, headers: { [name: string]: string }) {
  console.log(`${__VU}: Get operation status ${operationId}`)
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/operations/operationId' },
    headers: headers,
  }

  const response = http.get(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/operations/${operationId}`,
    k6Params,
  )
  check(response, {
    'Status: operation exists': (r) => r.status === 200,
  })
  return {
    status: response.json('status'),
  }
}

export function waitForOperation(
  operationId,
  expectedStatus,
  headers: { [name: string]: string },
) {
  for (
    let retries = parseInt(defaults.K6.waitRetries);
    retries > 0;
    retries--
  ) {
    const response = getOperationStatus(operationId, headers)

    if (response.status == expectedStatus) {
      check(response, {
        'Wait: valid operation status': (res) => res.status === expectedStatus,
      })
      return response.status
    }
    sleep(parseInt(defaults.K6.sleepTime))
  }
  fail(
    `Error: we couldn't get the expected status: ${expectedStatus} updated for this operation Id : ${operationId} in time`,
  )
}

export function getLegalEntity(id, headers: { [name: string]: string }) {
  console.log(`${__VU}: Get legal entity ${id}`)
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/legal-entities/id' },
    headers: headers,
  }

  const response = http.get(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/legal-entities/${id}`,
    k6Params,
  )
  console.log(`\nresponse: ${response.body}`)
  check(response, {
    'LegalEntity: is good': (r) => r.status === 200,
  })

  check(response, {
    'LegalEntity: valid entity id': (res) => res.json('id') === id,
    'LegalEntity: valid ethereum address': (res) => {
      const ethereumAddresses = res.json('ethereumAddress') as JSONArray
      return ethereumAddresses.length > 0
    },
  })
  return {
    ethereumAddress: response.json('ethereumAddress'),
    orchestrateChainName: response.json('orchestrateChainName'),
  }
}

export function getCurrencyHolderBalanceBlockchain(
  ethereumAddress,
  currencyEthereumAddress,
  chainName,
  headers: { [name: string]: string },
) {
  console.log(
    `${__VU}: Get currency holder balance directly from the blockchain ${ethereumAddress} ${currencyEthereumAddress} ${chainName}`,
  )
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: {
      name: '/holders/balance?currencyEthereumAddress&ethereumAddress&chainName',
    },
    headers: headers,
  }
  const response = http.get(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/holders/balance?currencyEthereumAddress=${encodeURIComponent(
      currencyEthereumAddress,
    )}&ethereumAddress=${encodeURIComponent(
      ethereumAddress,
    )}&chainName=${encodeURIComponent(chainName)}`,
    k6Params,
  )
  check(response, {
    'Holder response: is good': (r) => r.status === 200,
  })

  return {
    balance: response.json('balance') as string,
  }
}

export function getDigitalCurrency(id, headers: { [name: string]: string }) {
  console.log(`${__VU}: Get digital currency ${id}`)

  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/digital-currencies/id' },
    headers: headers,
  }

  const response = http.get(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/digital-currencies/${id}`,
    k6Params,
  )
  check(response, {
    'DigitalCurrency: is good': (r) => r.status === 200,
  })
  check(response, {
    'DigitalCurrency: valid currency id': (res) => res.json('id') !== null,
    'DigitalCurrency: valid operation id': (res) =>
      res.json('operationId') !== null,
    'DigitalCurrency: valid deployer address': (res) =>
      res.json('deployerAddress') !== null,
    'DigitalCurrency: valid currency ethereum address': (res) => {
      const currencyEthereumAddresses = res.json(
        'currencyEthereumAddress',
      ) as JSONArray
      return currencyEthereumAddresses.length > 0
    },
  })

  return {
    id: response.json('id'),
    operationId: response.json('operationId'),
    deployerAddress: response.json('deployerAddress'),
    currencyEthereumAddress: response.json('currencyEthereumAddress'),
  }
}

export function createDigitalCurrency(
  name,
  symbol,
  decimals = 2,
  headers: { [name: string]: string },
) {
  console.log(`${__VU}: Create currency ${name}`)
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/digital-currencies' },
    headers: headers,
  }

  const response = http.post(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/digital-currencies`,
    JSON.stringify({
      name,
      symbol,
      decimals,
    }),
    k6Params,
  )
  check(response, {
    'Create: is good': (r) => r.status === 202,
  })
  check(response, {
    'Create: valid currency id': (res) => res.json('id') !== null,
    'Create: valid operation id': (res) => res.json('operationId') !== null,
    'Create: valid deployer address': (res) =>
      res.json('deployerAddress') !== null,
  })
  return {
    id: response.json('id'),
    operationId: response.json('operationId'),
    deployerAddress: response.json('deployerAddress'),
  }
}

export function mintDigitalCurrency(
  id,
  amount,
  deployerAddress,
  headers: { [name: string]: string },
) {
  console.log(`${__VU}: Mint ${amount} units of ${id} to ${deployerAddress}`)
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/digital-currencies/id/mint' },
    headers: headers,
  }

  const response = http.put(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/digital-currencies/${id}/mint`,
    JSON.stringify({
      amount,
      to: deployerAddress,
    }),
    k6Params,
  )
  check(response, {
    'Mint: is good': (r) => r.status === 202,
  })
  check(response, {
    'Mint: valid operation id': (res) => res.json('operationId') !== null,
  })
  return {
    operationId: response.json('operationId'),
  }
}

export function transferDigitalCurrency(
  id,
  amount,
  ethereumAddress,
  headers: { [name: string]: string },
) {
  console.log(
    `${__VU}: Transfer ${amount} units of ${id} to ${ethereumAddress}`,
  )
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/digital-currencies/id/transfer' },
    headers: headers,
  }

  const response = http.put(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
    }/digital-currencies/${id}/transfer`,
    JSON.stringify({
      amount,
      to: ethereumAddress,
    }),
    k6Params,
  )
  if (response.status !== 202) {
    console.log(
      `Error when calling transferDigitalCurrency endpoint: response status : ${response.status}, response body : ${response.body}`,
    )
  }
  check(response, {
    'Transfer: is good': (r) => r.status === 202,
  })
  check(response, {
    'Transfer: valid operation id': (res) => res.json('operationId') != null,
  })
  return {
    operationId: response.json('operationId'),
  }
}

export function createEntityWallet(
  name,
  legalEntity,
  type,
  headers: { [name: string]: string },
) {
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/entity/' },
    headers: headers,
  }
  const response = http.post(
    `${
      defaults.ENVIRONMENT.ALL[defaults.K6.environment].entityUrl
    }/entity/${legalEntity}/wallet?setAsDefault=false`,
    JSON.stringify({
      type: type,
      metadata: { name },
    }),
    k6Params,
  )

  check(response, {
    'Wallet creation: is good': (r) => r.status === 201,
  })

  if (response.status !== 201) {
    console.log(
      `error, createEntityWallet response status: ${response.status}, response body : ${response.body}`,
    )
  }

  check(response, {
    'Wallet: address exists': (res) => res.json('address') != null,
  })

  console.log(`Wallet address: ${response.json('address')}`)

  return {
    walletAddress: response.json('address'),
  }
}
