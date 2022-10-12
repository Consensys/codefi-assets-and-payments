import request from 'supertest'
import { TestingModule } from '@nestjs/testing'
import {
  validFirstTransactionRequest,
  validFirstUpdatedTransactionRequest,
  validSecondTransactionRequest,
} from 'test/mocks'
import { getServer } from '../testServer'
import { Repository } from 'typeorm'
import { Transaction } from 'src/models/TransactionEntity'

describe('/transactions', () => {
  const defaultUrl = '/transactions'

  let app: request.SuperTest<request.Test>
  let module: TestingModule
  let transactionsRepository: Repository<Transaction>
  const tenantId = 'fakeTenantId'

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer()
    app = superTestApp
    module = moduleRef

    transactionsRepository = module.get('TransactionRepository')
  })

  afterAll(async () => {
    await transactionsRepository.delete({ tenantId })
  })

  describe('GET transactions', () => {
    let transaction: Transaction

    beforeAll(async () => {
      await transactionsRepository.delete({ tenantId })
      transaction = await transactionsRepository.save({
        ...validFirstTransactionRequest,
        tenantId,
      })
    })

    afterAll(async () => {
      await transactionsRepository.delete({ tenantId })
    })

    it('returns all transactions', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200)

      expect(resp.body).toHaveLength(1)
      expect(resp.body[0]).toEqual(
        expect.objectContaining(validFirstTransactionRequest),
      )
    })

    it('returns a transaction by id', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${transaction.id}`)
        .expect(200)

      expect(resp.body).toHaveLength(1)
      expect(resp.body[0]).toEqual(
        expect.objectContaining(validFirstTransactionRequest),
      )
    })

    it('returns all transactions by status', async () => {
      const resp = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&field=status&value=${transaction.status}`,
        )
        .expect(200)

      expect(resp.body).toHaveLength(1)
      expect(resp.body[0]).toEqual(
        expect.objectContaining(validFirstTransactionRequest),
      )
    })

    it('returns a transaction by identifierOrchestrateId', async () => {
      const resp = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&field=identifierOrchestrateId&value=${transaction.identifierOrchestrateId}`,
        )
        .expect(200)

      expect(resp.body).toHaveLength(1)
      expect(resp.body[0]).toEqual(
        expect.objectContaining(validFirstTransactionRequest),
      )
    })
  })

  describe('POST transactions', () => {
    afterEach(async () => {
      await transactionsRepository.delete({ tenantId })
    })

    it('creates a transaction', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstTransactionRequest)
        .expect(201)

      expect(resp.body).toEqual(
        expect.objectContaining(validFirstTransactionRequest),
      )
    })

    it('fails to create a transaction with a orchestrateId of an already existing transaction', async () => {
      await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstTransactionRequest)
        .expect(201)

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstTransactionRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Transaction with orchestrateId: ${validFirstTransactionRequest.identifierOrchestrateId} already exists, please choose another ID`,
      })
    })

    it('fails to create a transaction with an invalid request', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validFirstTransactionRequest, extraField: 5 })
        .expect(422)

      expect(resp.body).toEqual({
        statusCode: 422,
        message: 'Validation error',
        error: ['"extraField" is not allowed'],
      })
    })
  })

  describe('PUT transactions/:id', () => {
    const tenantId = 'fakeTenantId'
    let entityCreated: Transaction

    beforeEach(async () => {
      await transactionsRepository.delete({ tenantId })
      entityCreated = await transactionsRepository.save({
        ...validFirstTransactionRequest,
        tenantId,
      })
    })

    afterAll(async () => {
      await transactionsRepository.delete({ tenantId })
    })

    it('updates a transaction', async () => {
      const { id } = entityCreated
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedTransactionRequest)
        .expect(200)

      expect(resp.body).toEqual(
        expect.objectContaining(validFirstUpdatedTransactionRequest),
      )
    })

    it('fails to update a transaction when invalid data', async () => {
      const { id } = entityCreated
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send({ ...validFirstUpdatedTransactionRequest, extraField: 5 })
        .expect(422)

      expect(resp.body).toEqual({
        statusCode: 422,
        message: 'Validation error',
        error: ['"extraField" is not allowed'],
      })
    })

    it('fails to update non existing transaction', async () => {
      const id = 1000000
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedTransactionRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the transaction with id=${id}`,
      })
    })

    it('fails to update transaction when id and orchestrateId do not match', async () => {
      const { id } = await transactionsRepository.save({
        ...validSecondTransactionRequest,
        tenantId,
      })

      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedTransactionRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Transaction with orchestrateId: ${validFirstUpdatedTransactionRequest.identifierOrchestrateId} already exists, please choose another ID`,
      })
    })

    it('fails to update transaction from a different tenantId', async () => {
      const { id } = entityCreated
      const tenantId = 'anotherFakeTenantId'

      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedTransactionRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: 'invalid tenantId',
      })
    })
  })

  describe('DELETE transactions/:id', () => {
    const tenantId = 'fakeTenantId'
    let entityCreated: Transaction

    beforeAll(async () => {
      await transactionsRepository.delete({ tenantId })
      entityCreated = await transactionsRepository.save({
        ...validFirstTransactionRequest,
        tenantId,
      })
    })

    afterAll(async () => {
      await transactionsRepository.delete({ tenantId })
    })

    it('deletes a transaction', async () => {
      const { id } = entityCreated
      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(200)

      expect(resp.body).toEqual({ message: '1 deleted transaction(s).' })
    })

    it('fails to delete a transaction when invalid data', async () => {
      const id = 'not_a_number'
      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(400)

      expect(resp.body).toEqual({
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      })
    })

    it('fails to delete a transaction that does not exist', async () => {
      const id = 1000000
      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the transaction with id=${id}`,
      })
    })
  })
})
