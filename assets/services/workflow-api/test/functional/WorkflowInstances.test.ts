import request from 'supertest'
import { TestingModule } from '@nestjs/testing'
import {
  validFirstWorkflowTemplateRequest,
  validUpdatedWorkflowInstanceRequest,
  validWorkflowInstanceRequest,
} from 'test/mocks'
import { getServer } from '../testServer'
import { Repository } from 'typeorm'
import { WorkflowTemplate } from 'src/models/WorkflowTemplateEntity'
import { WorkflowInstance } from 'src/models/WorkflowInstanceEntity'
import { TransitionInstance } from 'src/models/TransitionInstanceEntity'

describe('/workflow/instances', () => {
  const defaultUrl = '/workflow/instances'

  let app: request.SuperTest<request.Test>
  let module: TestingModule
  let workflowTemplateRepository: Repository<WorkflowTemplate>
  let workflowInstanceRepository: Repository<WorkflowInstance>
  let transitionRepository: Repository<TransitionInstance>
  const tenantId = 'fakeTenantId'
  let workflowTemplateId

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer()
    app = superTestApp
    module = moduleRef

    workflowTemplateRepository = module.get('WorkflowTemplateRepository')
    workflowInstanceRepository = module.get('WorkflowInstanceRepository')
    transitionRepository = module.get('TransitionInstanceRepository')

    const { id } = await workflowTemplateRepository.save({
      ...validFirstWorkflowTemplateRequest,
      tenantId,
    })

    workflowTemplateId = id
  })

  afterAll(async () => {
    await workflowTemplateRepository.delete({ tenantId })
  })

  describe('GET workflow/instances', () => {
    let workflowInstance: WorkflowInstance

    beforeAll(async () => {
      await workflowInstanceRepository.delete({ tenantId })
      workflowInstance = await workflowInstanceRepository.save({
        ...validWorkflowInstanceRequest,
        tenantId,
        workflowTemplateId,
      })
    })

    afterAll(async () => {
      await workflowInstanceRepository.delete({ tenantId })
    })

    it('returns all workflow instances for a given tenant', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200)

      expect(resp.body).toHaveLength(2)
      expect(resp.body[1]).toBe(1)
      expect(resp.body[0]).toHaveLength(1)
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining({
          ...validWorkflowInstanceRequest,
          date: validWorkflowInstanceRequest.date.toISOString(),
          price: validWorkflowInstanceRequest.price.toString(),
          quantity: validWorkflowInstanceRequest.quantity.toString(),
          workflowTemplateId,
        }),
      )
    })

    it('returns all workflow instance by id', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${workflowInstance.id}`)
        .expect(200)

      expect(resp.body).toHaveLength(2)
      expect(resp.body[1]).toBe(1)
      expect(resp.body[0]).toHaveLength(1)
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining({
          ...validWorkflowInstanceRequest,
          date: validWorkflowInstanceRequest.date.toISOString(),
          price: validWorkflowInstanceRequest.price.toString(),
          quantity: validWorkflowInstanceRequest.quantity.toString(),
          workflowTemplateId,
        }),
      )
    })

    it('returns all workflow instance by multiple ids', async () => {
      const ids = JSON.stringify([workflowInstance.id])
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&ids=${ids}`)
        .expect(200)

      expect(resp.body).toHaveLength(2)
      expect(resp.body[1]).toBe(1)
      expect(resp.body[0]).toHaveLength(1)
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining({
          ...validWorkflowInstanceRequest,
          date: validWorkflowInstanceRequest.date.toISOString(),
          price: validWorkflowInstanceRequest.price.toString(),
          quantity: validWorkflowInstanceRequest.quantity.toString(),
          workflowTemplateId,
        }),
      )
    })
  })

  describe('POST workflow/instances', () => {
    afterEach(async () => {
      await workflowInstanceRepository.delete({ tenantId })
      await transitionRepository.delete({ tenantId })
    })

    it('creates a workflow instance for a given templateId', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validWorkflowInstanceRequest, workflowTemplateId })
        .expect(201)

      expect(resp.body).toEqual(
        expect.objectContaining({
          ...validWorkflowInstanceRequest,
          date: validWorkflowInstanceRequest.date.toISOString(),
          workflowTemplateId,
        }),
      )
    })

    it('fails to create a workflow instance for a different template', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validWorkflowInstanceRequest, workflowTemplateId: 1 })
        .expect(403)

      expect(resp.body).toEqual({
        status: 403,
        error:
          'We could not find a unique transition template matching the transition.',
        result: [],
      })
    })

    it('fails to create a workflow instance for template that does not exist', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validWorkflowInstanceRequest, workflowTemplateId: 10000000 })
        .expect(403)

      expect(resp.body).toEqual({
        status: 403,
        error:
          'We could not find a unique transition template matching the transition.',
      })
    })

    it('fails to create a workflow instance without a userId if type is not Order', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...validWorkflowInstanceRequest,
          workflowTemplateId,
          userId: null,
        })
        .expect(500)

      expect(resp.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
      })
    })
  })

  describe('PUT workflow/instances/:id', () => {
    let workflowInstance: WorkflowInstance

    beforeEach(async () => {
      workflowInstance = await workflowInstanceRepository.save({
        ...validWorkflowInstanceRequest,
        tenantId,
        workflowTemplateId,
      })
    })

    afterEach(async () => {
      await workflowInstanceRepository.delete({ tenantId })
    })

    it('updates a workflow instance for a given templateId', async () => {
      const resp = await app
        .put(`${defaultUrl}/${workflowInstance.id}?tenantId=${tenantId}`)
        .send({ ...validUpdatedWorkflowInstanceRequest, workflowTemplateId })
        .expect(200)

      expect(resp.body).toEqual(
        expect.objectContaining({
          ...validUpdatedWorkflowInstanceRequest,
          date: validWorkflowInstanceRequest.date.toISOString(),
          workflowTemplateId,
        }),
      )
    })

    it('fails to update a workflow instance that does not exist', async () => {
      const id = 100000

      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send({
          ...validUpdatedWorkflowInstanceRequest,
          workflowTemplateId,
        })
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the instance with id=${id}`,
      })
    })
  })

  describe('DELETE workflow/instances/:id', () => {
    let workflowInstance: WorkflowInstance

    beforeEach(async () => {
      workflowInstance = await workflowInstanceRepository.save({
        ...validWorkflowInstanceRequest,
        tenantId,
        workflowTemplateId,
      })
    })

    afterEach(async () => {
      await workflowInstanceRepository.delete({ tenantId })
    })

    it('deletes a workflow instance for a given templateId', async () => {
      const resp = await app
        .delete(`${defaultUrl}/${workflowInstance.id}?tenantId=${tenantId}`)
        .expect(200)

      expect(resp.body).toEqual({
        message: '1 deleted workflowInstance(s).',
      })
    })

    it('fails to delete a workflow instance that does not exist', async () => {
      const id = 100000

      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the workflowInstance with id=${id}`,
      })
    })
  })

  describe('GET workflow/instances/:id/transitions', () => {
    let workflowInstance: WorkflowInstance

    beforeAll(async () => {
      await workflowInstanceRepository.delete({ tenantId })
      await transitionRepository.delete({ tenantId })

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validWorkflowInstanceRequest, workflowTemplateId })
        .expect(201)

      workflowInstance = resp.body
    })

    afterAll(async () => {
      await workflowInstanceRepository.delete({ tenantId })
      await transitionRepository.delete({ tenantId })
    })

    it('returns all workflow instance transitions', async () => {
      const resp = await app
        .get(
          `${defaultUrl}/${workflowInstance.id}/transitions?tenantId=${tenantId}`,
        )
        .expect(200)

      expect(resp.body).toHaveLength(1)
      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          fromState: '__notStarted__',
          name: 'invite',
          role: 'ISSUER',
          tenantId: 'fakeTenantId',
          toState: 'invited',
          userId: '2853ab53-e6db-4b38-9612-db3f3b5683ff',
        }),
      )
    })
  })
})
