import {
  allWorkflows,
  FunctionName,
  WorkflowName,
} from 'src/constants/workflowTemplates'
import request from 'supertest'
import { TestingModule } from '@nestjs/testing'
import {
  validFirstUpdatedWorkflowTemplateRequest,
  validFirstWorkflowTemplateRequest,
  validSecondWorkflowTemplateRequest,
} from 'test/mocks'
import { getServer } from '../testServer'
import { Repository } from 'typeorm'
import { WorkflowTemplate } from 'src/models/WorkflowTemplateEntity'
import { UserType } from 'src/constants/roles'
import { APPROVED, INITIALIZED, NOT_STARTED, PRE_CREATED, SUBMITTED, CANCELLED } from 'src/constants/states'

describe('workflow/templates', () => {
  const defaultUrl = '/workflow/templates'

  let app: request.SuperTest<request.Test>
  let module: TestingModule
  let workflowTemplateRepository: Repository<WorkflowTemplate>
  const defaultTenantId = 'codefi'

  beforeAll(() => {
    const { superTestApp, moduleRef } = getServer()
    app = superTestApp
    module = moduleRef

    workflowTemplateRepository = module.get('WorkflowTemplateRepository')
  })

  describe('GET workflow/templates', () => {
    it('returns all workflow templates for a given tenant', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${defaultTenantId}`)
        .expect(200)

      expect(resp.body.length).toBe(allWorkflows.length)

      resp.body.forEach(template => {
        const constantTemplate = allWorkflows.find(
          t => template.name === t.name,
        )

        expect(template).toEqual(expect.objectContaining(constantTemplate))
      })
    })

    it('returns workflow templates for a given tenant filtered by value', async () => {
      const field = 'name'
      const value = WorkflowName.ASSET_CREATION
      const resp = await app
        .get(
          `${defaultUrl}?tenantId=${defaultTenantId}&field=${field}&value=${value}`,
        )
        .expect(200)

      const constantTemplate = allWorkflows.find(t => value === t.name)
      expect(resp.body[0]).toEqual(expect.objectContaining(constantTemplate))
    })
  })

  describe('GET workflow/templates/nextState', () => {
    it('returns workflow templates next state', async () => {
      const workflowName = WorkflowName.ASSET_CREATION
      const transitionName = FunctionName.INIT_ASSET_INSTANCE
      const role = UserType.ISSUER
      const fromState = NOT_STARTED

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromState=${fromState}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.text).toBe(INITIALIZED)
    })


    it('returns PRE_CREATED state when called by an AGENT from NOT_STARTED state', async () => {
      const workflowName = WorkflowName.ASSET_SECONDARY_TRADE
      const transitionName = FunctionName.PRE_CREATE_SECONDARY_TRADE_ORDER
      const role = UserType.AGENT
      const fromState = NOT_STARTED

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromState=${fromState}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.text).toBe(PRE_CREATED)
    })

    it('returns APPROVED state when called from PRE_CREATED state by investor', async () => {
      const workflowName = WorkflowName.ASSET_SECONDARY_TRADE
      const transitionName = FunctionName.APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER
      const role = UserType.INVESTOR
      const fromState = PRE_CREATED

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromState=${fromState}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.text).toBe(APPROVED)
    })

    it('returns CANCELLED state when called from PRE_CREATED state by investor', async () => {
      const workflowName = WorkflowName.ASSET_SECONDARY_TRADE
      const transitionName = FunctionName.CANCEL_SECONDARY_TRADE_ORDER
      const role = UserType.INVESTOR
      const fromState = PRE_CREATED

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromState=${fromState}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.text).toBe(CANCELLED)
    })

    it('returns CANCELLED state when called from PRE_CREATED state by an agent', async () => {
      const workflowName = WorkflowName.ASSET_SECONDARY_TRADE
      const transitionName = FunctionName.CANCEL_SECONDARY_TRADE_ORDER
      const role = UserType.AGENT
      const fromState = PRE_CREATED

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromState=${fromState}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.text).toBe(CANCELLED)
    })

    it('returns workflow templates list of next states', async () => {
      const workflowName = WorkflowName.ASSET_CREATION
      const transitionName = FunctionName.UPDATE_ASSET_INSTANCE
      const role = UserType.ISSUER
      const fromStates = JSON.stringify([SUBMITTED, INITIALIZED])

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}&fromStates=${fromStates}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(200)

      expect(resp.body).toEqual([SUBMITTED, INITIALIZED])
    })

    it('fails to return workflow templates next state when fromState(s) is not sent', async () => {
      const workflowName = WorkflowName.ASSET_CREATION
      const transitionName = FunctionName.INIT_ASSET_INSTANCE
      const role = UserType.ISSUER

      const apiQuery = `tenantId=${defaultTenantId}&workflowName=${workflowName}&transitionName=${transitionName}&role=${role}`

      const resp = await app
        .get(`${defaultUrl}/nextstate?${apiQuery}`)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `impossible to determine the next state: no valid state transition was found for initial state undefined, role ${role} and transitionName ${transitionName}`,
      })
    })
  })

  describe('POST workflow/templates', () => {
    const tenantId = 'fakeTenantId'

    beforeAll(async () => {
      await workflowTemplateRepository.delete({ tenantId })
    })

    afterEach(async () => {
      await workflowTemplateRepository.delete({ tenantId })
    })

    it('creates a workflow template with transitions', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstWorkflowTemplateRequest)
        .expect(201)

      expect(resp.body).toEqual(
        expect.objectContaining(validFirstWorkflowTemplateRequest),
      )
    })

    it('creates a workflow template without transitions', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validSecondWorkflowTemplateRequest)
        .expect(201)

      expect(resp.body).toEqual(
        expect.objectContaining(validSecondWorkflowTemplateRequest),
      )
    })

    it('fails to create a workflow when invalid data', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...validFirstWorkflowTemplateRequest, extraField: 5 })
        .expect(422)

      expect(resp.body).toEqual({
        statusCode: 422,
        message: 'Validation error',
        error: ['"extraField" is not allowed'],
      })
    })

    it('fails to create a workflow with a name of an already existing workflow', async () => {
      await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstWorkflowTemplateRequest)
        .expect(201)

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(validFirstWorkflowTemplateRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Template with name: ${validFirstWorkflowTemplateRequest.name} already exists, please choose another name`,
      })
    })
  })

  describe('PUT workflow/templates/:id', () => {
    const tenantId = 'fakeTenantId'
    let entityCreated: WorkflowTemplate

    beforeEach(async () => {
      await workflowTemplateRepository.delete({ tenantId })
      entityCreated = await workflowTemplateRepository.save({
        ...validFirstWorkflowTemplateRequest,
        tenantId,
      })
    })

    afterAll(async () => {
      await workflowTemplateRepository.delete({ tenantId })
    })

    it('updates a workflow template with transitions', async () => {
      const { id } = entityCreated
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedWorkflowTemplateRequest)
        .expect(200)

      expect(resp.body).toEqual(
        expect.objectContaining(validFirstUpdatedWorkflowTemplateRequest),
      )
    })

    it('fails to update a workflow when invalid data', async () => {
      const { id } = entityCreated
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send({ ...validFirstUpdatedWorkflowTemplateRequest, extraField: 5 })
        .expect(422)

      expect(resp.body).toEqual({
        statusCode: 422,
        message: 'Validation error',
        error: ['"extraField" is not allowed'],
      })
    })

    it('fails to update non existing workflow', async () => {
      const id = 1000000
      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstUpdatedWorkflowTemplateRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the template with id=${id}`,
      })
    })

    it('fails to update workflow when id and name do not match', async () => {
      const { id } = await workflowTemplateRepository.save({
        ...validSecondWorkflowTemplateRequest,
        tenantId,
      })

      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send(validFirstWorkflowTemplateRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Template with name: ${validFirstWorkflowTemplateRequest.name} already exists, please choose another name`,
      })
    })

    it('fails to update workflow from a different tenantId', async () => {
      const { id } = entityCreated

      const resp = await app
        .put(`${defaultUrl}/${id}?tenantId=${defaultTenantId}`)
        .send(validFirstUpdatedWorkflowTemplateRequest)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: 'invalid tenantId',
      })
    })
  })

  describe('DELETE workflow/templates/:id', () => {
    const tenantId = 'fakeTenantId'
    let entityCreated: WorkflowTemplate

    beforeAll(async () => {
      await workflowTemplateRepository.delete({ tenantId })
      entityCreated = await workflowTemplateRepository.save({
        ...validFirstWorkflowTemplateRequest,
        tenantId,
      })
    })

    afterAll(async () => {
      await workflowTemplateRepository.delete({ tenantId })
    })

    it('deletes a workflow template', async () => {
      const { id } = entityCreated
      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(200)

      expect(resp.body).toEqual({ message: '1 deleted workflowTemplate(s).' })
    })

    it('fails to delete a workflow when invalid data', async () => {
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

    it('fails to delete a workflow that does not exist', async () => {
      const id = 1000000
      const resp = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(400)

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the workflowTemplate with id=${id}`,
      })
    })
  })
})
