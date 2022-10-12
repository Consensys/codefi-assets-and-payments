import request from 'supertest'
import { TestingModule } from '@nestjs/testing'
import { validTransactionRequests } from 'test/mocks'
import { getServer } from '../testServer'
import { Repository } from 'typeorm'
import { Transaction } from 'src/models/TransactionEntity'

describe('/v2/transactions', () => {
  const defaultUrl = '/v2/transactions'

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

  describe('POST v2/transactions', () => {
    afterEach(async () => {
      await transactionsRepository.delete({ tenantId })
    })

    it('creates two transactions', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validTransactionRequests)
        .expect(201)

      expect(resp.body.length).toBe(validTransactionRequests.length)

      resp.body.forEach(transaction => {
        const transactionRequest = validTransactionRequests.find(
          t =>
            transaction.identifierOrchestrateId === t.identifierOrchestrateId,
        )

        expect(transaction).toEqual(expect.objectContaining(transactionRequest))
      })
    })

    it('fails to create transactions with a orchestrateId of an already existing transaction', async () => {
      await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validTransactionRequests)
        .expect(201)

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validTransactionRequests)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Transaction with orchestrateIds: ${validTransactionRequests.map(
          t => t.identifierOrchestrateId,
        )} already exists, please choose another ID(s)`,
      })
    })
  })
})
