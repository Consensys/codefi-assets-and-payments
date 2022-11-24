import { MicroserviceMessage } from '@consensys/messaging-events'
import { EntityStatus } from '@consensys/ts-types'
import { operationIdMock } from '../../test/mocks'
import { sleep } from '../../src/utils/sleep'
import { TestScenario } from './scenario'
import { v4 as uuidv4 } from 'uuid'

export const handlesMultipleCommandsWithSameOperationIds = async (
  scenario: TestScenario,
  command: MicroserviceMessage<unknown>,
  payload: any,
) => {
  scenario.checkError()

  const commandPayload = { ...payload, operationId: operationIdMock }

  await scenario.operationRepo.delete({})
  await scenario.runCommand(command, commandPayload)
  await scenario.runCommand(command, commandPayload, {
    waitForAsyncResult: false,
  })

  // Rule out the Token API consumer being slow to process the commands.
  await sleep(5000)

  const operations = await scenario.operationRepo.find({})
  expect(operations.length).toEqual(1)

  expect(operations[0]).toEqual(
    expect.objectContaining({
      status: EntityStatus.Confirmed,
      transactionId: expect.any(String),
      transactionHash: expect.any(String),
    }),
  )
}

export const handlesMultipleCommandsWithSameIdempotencyKeys = async (
  scenario: TestScenario,
  command: MicroserviceMessage<unknown>,
  payload: any,
) => {
  scenario.checkError()

  const idempotencyKey = uuidv4()
  const commandPayload = { ...payload, idempotencyKey }

  await scenario.operationRepo.delete({})

  const { asyncResult: firstAsyncResult } = await scenario.runCommand(
    command,
    commandPayload,
  )

  const { asyncResult: secondAsyncResult } = await scenario.runCommand(
    command,
    commandPayload,
    {
      waitForOperation: false,
    },
  )

  const operations = await scenario.operationRepo.find({})
  expect(operations.length).toEqual(1)

  expect(operations[0]).toEqual(
    expect.objectContaining({
      status: EntityStatus.Confirmed,
      transactionId: expect.any(String),
      transactionHash: expect.any(String),
    }),
  )

  expect(firstAsyncResult.result).toEqual(true)

  expect(secondAsyncResult.result).toEqual(false)
  expect(secondAsyncResult.error).toEqual(
    `Transaction already has an operation record - ` +
      `Transaction ID: ${operations[0].transactionId} | Existing Operation ID: ${operations[0].id}`,
  )
}

export const handlesMultipleRequestsWithSameOperationIds = async (
  scenario: TestScenario,
  requestHelper: Function,
  args: any,
  options: any = {},
) => {
  scenario.checkError()

  const hasNoTransaction = options.hasTransaction === false
  const newArgs = { ...args, operationId: operationIdMock }

  await scenario.operationRepo.delete({})

  const { response: firstResponse, asyncResult: firstAsyncResult } =
    await scenario.runRequest(requestHelper, newArgs, options)

  const { response: secondResponse } = await scenario.runRequest(
    requestHelper,
    newArgs,
    { ...options, waitForAsyncResult: false },
  )

  const firstResponseTxId =
    firstResponse.data?.token?.transactionId ||
    firstResponse.data?.transactionId

  const secondResponseTxId =
    secondResponse.data?.token?.transactionId ||
    secondResponse.data?.transactionId

  const operations = await scenario.operationRepo.find({})
  expect(operations.length).toEqual(1)
  expect(operations[0].status).toEqual(EntityStatus.Confirmed)

  if (hasNoTransaction) return

  expect(operations[0].transactionId).toEqual(expect.any(String))
  expect(operations[0].transactionHash).toEqual(expect.any(String))
  expect(firstAsyncResult.result).toEqual(true)
  expect(firstResponseTxId).toEqual(operations[0].transactionId)
  expect(secondResponseTxId).toEqual(operations[0].transactionId)
}

export const handlesMultipleRequestsWithSameIdempotencyKeys = async (
  scenario: TestScenario,
  requestHelper: Function,
  args: any,
) => {
  scenario.checkError()

  const newArgs = { ...args, idempotencyKey: uuidv4() }

  await scenario.operationRepo.delete({})

  const {
    response: firstResponse,
    operation: firstOperation,
    asyncResult: firstAsyncResult,
  } = await scenario.runRequest(requestHelper, newArgs)

  const firstResponseTxId =
    firstResponse.data?.token?.transactionId ||
    firstResponse.data?.transactionId

  await expect(
    scenario.runRequest(requestHelper, newArgs, { waitForAsyncResult: false }),
  ).rejects.toThrowError(
    `Request failed with status code 500 - ` +
      `Transaction already has an operation record - ` +
      `Transaction ID: ${firstResponseTxId} | Existing Operation ID: ${firstOperation.id}`,
  )

  const operations = await scenario.operationRepo.find({})
  expect(operations.length).toEqual(1)

  expect(operations[0]).toEqual(
    expect.objectContaining({
      status: EntityStatus.Confirmed,
      transactionId: expect.any(String),
      transactionHash: expect.any(String),
    }),
  )

  expect(firstAsyncResult.result).toEqual(true)
  expect(firstResponseTxId).toEqual(operations[0].transactionId)
}
