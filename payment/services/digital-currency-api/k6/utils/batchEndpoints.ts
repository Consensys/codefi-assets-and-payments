import { check, fail, sleep } from 'k6'
import http, {
  BatchRequest,
  ObjectBatchRequest,
  RefinedResponse,
  ResponseType,
} from 'k6/http'
import { Params } from 'k6/http'
import * as defaults from './config'

function tpsBatchRequest(
  requests: BatchRequest[],
  msg = '',
  timeoutCallback: Function = null,
) {
  // Batch multiple HTTP requests together,
  // to issue them in parallel over multiple TCP connections
  // divided by chunks to emulate TPS logic
  const responses: RefinedResponse<ResponseType>[] = []
  const chunks: BatchRequest[][] = []
  const chunkSize: number = parseInt(`${defaults.K6.persistentLoadTPS}`)

  console.log(`tpsBatchRequest BATCH(requests): ${requests.length}`)
  console.log(`tpsBatchRequest chunkSize(tps): ${chunkSize}`)
  for (let i = 0; i < requests.length; i += chunkSize) {
    const chunk = requests.slice(i, i + chunkSize)
    chunks.push(chunk)
  }

  chunks.forEach((batchRequest, index) => {
    timeoutCallback?.()

    const startTime = Date.now()
    const resp = http.batch(batchRequest)
    responses.push(...resp)
    if (msg !== '') {
      console.log(
        `[batch ${index + 1}/${chunks.length}] : ${msg} (${chunkSize} req)`,
      )
    }
    const timeTaken = (Date.now() - startTime) / 1000
    // adjust waiting time to emulate TPS logic
    const timeToWait = timeTaken < 1 ? 1 - timeTaken : 0
    sleep(timeToWait)
  })

  return responses
}

function getOperationsStatusBatch(
  operationIds,
  headers: { [name: string]: string },
  timeoutCallback: Function = null,
) {
  const requests: ObjectBatchRequest[] = []
  const idsStatus: { [name: string]: string } = {}

  console.log('Get operation statuses')
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/operations/operationId' },
    headers: headers,
  }

  operationIds.forEach((id) => {
    const req: ObjectBatchRequest = {
      method: 'GET',
      url: `${
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
      }/operations/${id}`,
      params: k6Params,
    }
    requests.push(req)
  })

  const responses = tpsBatchRequest(
    requests,
    'operation statuses',
    timeoutCallback,
  )
  for (let i = 0; i < responses.length; i++) {
    check(responses[i], {
      'Status: operation exists': (r) => r.status === 200,
    })
    if (responses[i].status !== 200) {
      console.log(
        `Check transaction status response status is not OK: ${JSON.stringify(
          responses[i].status_text,
        )}`,
      )
      // give another chance to process a transaction if failed
      idsStatus[operationIds[i]] = 'pending'
      continue
    }
    idsStatus[operationIds[i]] = responses[i].json('status').toString()
  }

  return idsStatus
}

export function waitForOperationsConfirmedBatch(
  operationIds,
  headers: { [name: string]: string },
  timeoutCallback: Function = null,
  failedOperationVerification = true
): number {
  let notProcessedIds: string[] = Array.from(operationIds)
  const failedIds: string[] = []
  const timeoutCallbackDelegate = timeoutCallback
    ? timeoutCallback.bind(this, () =>
        fail(
          `We couldn't get the expected confirmed statuses for these operation Ids(${notProcessedIds.length}) : ${notProcessedIds} in time`,
        ),
      )
    : null

  while (true) {
    const idStatuses = getOperationsStatusBatch(
      notProcessedIds,
      headers,
      timeoutCallbackDelegate,
    )
    notProcessedIds = []
    for (const [key, value] of Object.entries(idStatuses)) {
      if (value == 'pending') {
        notProcessedIds.push(key)
      }
      if (value == 'failed') {
        failedIds.push(key)
        if (failedOperationVerification) {
          check(failedIds, {
            'Transfer is not failed': (ids) => ids.length === 0,
          })
        }
      }
    }

    if (!notProcessedIds.length) {
      if (!failedIds.length) {
        console.log('All transfers have been confirmed')
      } else {
        console.log(`Failed transaction ids : ${failedIds}`)
        console.log(`Failed transactions amount: ${failedIds.length}`)
      }

      return operationIds.length - failedIds.length
    }
    console.log(
      `Not processed Ids (${notProcessedIds.length}): ${notProcessedIds}`,
    )
  }
}

export function transferDigitalCurrencyBatch(
  id,
  amount,
  ethereumAddress: string,
  operationsAmount: number,
  headers: { [name: string]: string },
): string[] {
  const k6Params: Params = {
    timeout: defaults.K6.timeout,
    tags: { name: '/digital-currencies/id/transfer' },
    headers: headers,
  }
  const requests: ObjectBatchRequest[] = []
  const operationIds: string[] = []
  console.log(`Receiver address -> ${ethereumAddress}`)
  for (let i = 0; i < operationsAmount; i++) {
    const req: ObjectBatchRequest = {
      method: 'PUT',
      url: `${
        defaults.ENVIRONMENT.ALL[defaults.K6.environment].paymentUrl
      }/digital-currencies/${id}/transfer`,
      body: JSON.stringify({
        amount: amount,
        to: ethereumAddress,
      }),
      params: k6Params,
    }
    requests.push(req)
  }

  const responses = tpsBatchRequest(requests, 'transfer digital currencies')
  responses.forEach((resp, index) => {
    check(resp, {
      'Transfer: is good': (resp) => resp.status === 202,
    })

    if (resp.status !== 202) {
      console.log(
        `Error when calling transferDigitalCurrency endpoint transferDigitalCurrency status : 
        ${resp.status}, transferDigitalCurrency RESPONSE : ${resp.body}`,
      )
      return
    }

    const address = resp.json('operationId').toString()
    check(resp, {
      'Transfer: valid operation id': (resp) => address != null,
    })
    operationIds.push(address)
  })

  console.log(`Transfer operationIds(${operationIds.length}) : ${operationIds}`)
  return operationIds
}
