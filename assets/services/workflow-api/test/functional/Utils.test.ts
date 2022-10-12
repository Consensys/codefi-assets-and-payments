import request from 'supertest'
import { TestingModule } from '@nestjs/testing'
import {
  validFirstTransactionRequest,
  validFirstTransitionInstanceRequest,
  validFirstWorkflowTemplateRequest,
  validWorkflowInstanceRequest,
} from 'test/mocks'
import { getServer } from '../testServer'
import { Repository } from 'typeorm'
import { Transaction } from 'src/models/TransactionEntity'
import { WorkflowTemplate } from 'src/models/WorkflowTemplateEntity'
import { WorkflowInstance } from 'src/models/WorkflowInstanceEntity'
import { TransitionInstance } from 'src/models/TransitionInstanceEntity'

describe('utils', () => {
  const defaultUrl = '/utils'

  let app: request.SuperTest<request.Test>
  let module: TestingModule
  let transactionsRepository: Repository<Transaction>
  let workflowTemplateRepository: Repository<WorkflowTemplate>
  let workflowInstanceRepository: Repository<WorkflowInstance>
  let transitionRepository: Repository<TransitionInstance>
  const tenantId = 'fakeTenantId'

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer()
    app = superTestApp
    module = moduleRef

    transactionsRepository = module.get('TransactionRepository')
    workflowTemplateRepository = module.get('WorkflowTemplateRepository')
    workflowInstanceRepository = module.get('WorkflowInstanceRepository')
    transitionRepository = module.get('TransitionInstanceRepository')
  })

  afterAll(async () => {
    await transactionsRepository.delete({ tenantId })
    await workflowTemplateRepository.delete({ tenantId })
    await workflowInstanceRepository.delete({ tenantId })
    await transitionRepository.delete({ tenantId })
  })

  describe('DELETE tenant/:tenantId', () => {
    let transactionId
    let workflowTemplateId
    let workflowInstanceId
    let transitionInstanceId

    beforeEach(async () => {
      const [
        transaction,
        workflowTemplate,
        workflowInstance,
        transitionInstance,
      ] = await Promise.all([
        transactionsRepository.save({
          ...validFirstTransactionRequest,
          tenantId,
        }),
        workflowTemplateRepository.save({
          ...validFirstWorkflowTemplateRequest,
          tenantId,
        }),
        workflowInstanceRepository.save({
          ...validWorkflowInstanceRequest,
          tenantId,
        }),
        transitionRepository.save({
          ...validFirstTransitionInstanceRequest,
          tenantId,
        }),
      ])

      transactionId = transaction.id
      workflowTemplateId = workflowTemplate.id
      workflowInstanceId = workflowInstance.id
      transitionInstanceId = transitionInstance.id
    })

    it('deletes all tenant data', async () => {
      const resp = await app
        .delete(`${defaultUrl}/tenant/${tenantId}`)
        .expect(200)

      expect(resp.body).toEqual({
        deletedTransactionsTotal: 1,
        deletedTransitionsTotal: 1,
        deletedWorkflowInstancesTotal: 1,
        deletedWorkflowTemplatesTotal: 1,
        message: 'Tenant fakeTenantId deleted successfully',
      })

      const [
        transaction,
        workflowTemplate,
        workflowInstance,
        transitionInstance,
      ] = await Promise.all([
        transactionsRepository.findOne({ where: { id: transactionId } }),
        workflowTemplateRepository.findOne({
          where: { id: workflowTemplateId },
        }),
        workflowInstanceRepository.findOne({
          where: { id: workflowInstanceId },
        }),
        transitionRepository.findOne({ where: { id: transitionInstanceId } }),
      ])

      expect(transaction).toBeNull()
      expect(workflowTemplate).toBeNull()
      expect(workflowInstance).toBeNull()
      expect(transitionInstance).toBeNull()
    })
  })
})
