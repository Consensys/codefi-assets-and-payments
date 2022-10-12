function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max))
}

import { Transaction } from '../src/models/TransactionEntity'
import { TransactionDto } from '../src/models/dto/TransactionDto'
import { TransitionInstance } from '../src/models/TransitionInstanceEntity'
import { TransitionInstanceDto } from '../src/models/dto/TransitionInstanceDto'
import { TransitionTemplateDto } from '../src/models/dto/TransitionTemplateDto'
import { WorkflowInstance } from '../src/models/WorkflowInstanceEntity'
import { WorkflowInstanceDto } from '../src/models/dto/WorkflowInstanceDto'
import { WorkflowTemplate } from '../src/models/WorkflowTemplateEntity'
import { WorkflowTemplateDto } from '../src/models/dto/WorkflowTemplateDto'
import { WorkflowType } from '../src/models/WorkflowType'
import { NOT_STARTED } from '../src/constants/states'
import { DeleteResult } from 'typeorm'
import { EntityType, OrderSide } from '../src/constants/enums'
import { UserType } from '../src/constants/roles'

const M = 1e4
export const mockId = 94
export const mockTenantId = 'fQPeYS1BhXQUbEKqBUGv0EXj7mluOfPa'
export const mockField = 'status'
export const mockValue = 'pending'
export const mockField2 = 'status'
export const mockValue2 = 'pending'
export const mockField3 = 'status'
export const mockValue3 = 'pending'
export const mockOtherValue1 = 'pending'
export const mockWorkflowType = WorkflowType.LINK
export const mockIds = [92, 94]
export const validTransitionFirstId = getRandomInt(M)
export const validTransitionSecondId = getRandomInt(M)
export const validTransitionThirdId = getRandomInt(M)
export const validWorkflowFirstId = getRandomInt(M)
export const validWorkflowSecondId = getRandomInt(M)
export const validWorkflowThirdId = getRandomInt(M)

export const mockUserId = '2853ab53-e6db-4b38-9612-db3f3b5683ff'
export const mockIdentityQuery = {
  tenantId: mockTenantId,
}

// transactions

export const validFirstTransactionRequest: TransactionDto = {
  status: 'pending',
  signerId: '61ee5e69-f388-4c6e-b974-d18c8bf7a990',
  callerId: 'fe9361c1-c783-4672-82c7-61ad22305f13',
  identifierOrchestrateId: 'qqquvqo9-3nea-whoj-9hy2-34pxwc974g2g',
  identifierTxHash:
    '0x0078ca5ff52518b5e504440a710db0a1bd69df930d8b6f6ea0ea3fe415ebfa07',
  identifierCustom: 'xxx',
  callbacks: { key: 'value' },
  context: { key: 'value' },
}

export const validFirstTransactionResponse: Transaction = {
  ...validFirstTransactionRequest,
  id: mockId,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validFirstUpdatedTransactionRequest: TransactionDto = {
  ...validFirstTransactionRequest,
  status: 'validated',
}

export const validFirstUpdatedTransactionResponse: Transaction = {
  ...validFirstTransactionResponse,
  status: 'validated',
}

export const validDeleteResponse: DeleteResult = {
  raw: {},
  affected: 1,
}

export const validSecondTransactionRequest: TransactionDto = {
  status: 'pending',
  signerId: '61ee5e69-f388-4c6e-b974-d18c8bf7a990',
  callerId: 'fe9361c1-c783-4672-82c7-61ad22305f13',
  identifierOrchestrateId: 'qqquvqo9-3nea-whoj-9hy2-34pxwc974g2t',
  identifierTxHash:
    '0x0078ca5ff52518b5e504440a710db0a1bd69df930d8b6f6ea0ea3fe415ebfa07',
  identifierCustom: 'xxx',
  callbacks: { key: 'value' },
  context: { key: 'value' },
}

export const validSecondTransactionResponse: Transaction = {
  ...validSecondTransactionRequest,
  id: 2,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validTransactionRequests = [
  validFirstTransactionRequest,
  validSecondTransactionRequest,
]

export const validTransactionResponses = [
  validFirstTransactionResponse,
  validSecondTransactionResponse,
]

// transition template

export const validFirstTransitionTemplate: TransitionTemplateDto = {
  name: 'invite',
  fromState: NOT_STARTED,
  toState: 'invited',
  role: 'ISSUER',
}
export const validSecondTransitionTemplate: TransitionTemplateDto = {
  name: 'submitKyc',
  fromState: 'invited',
  toState: 'kycSubmitted',
  role: 'INVESTOR',
}
export const validThirdTransitionTemplate: TransitionTemplateDto = {
  name: 'validateKyc',
  fromState: 'kycSubmitted',
  toState: 'validated',
  role: 'ISSUER',
}
export const validFourthTransitionTemplate: TransitionTemplateDto = {
  name: 'rejectKyc',
  fromState: 'validated',
  toState: 'rejected',
  role: 'ISSUER',
}

// workflow template

export const validFirstWorkflowTemplateRequest: WorkflowTemplateDto = {
  name: 'kyc_without_rejection',
  workflowType: WorkflowType.LINK,
  roles: ['ISSUER', 'INVESTOR'],
  states: ['__notStarted__', 'invited', 'kycSubmitted', 'validated'],
  transitionTemplates: [
    validFirstTransitionTemplate,
    validSecondTransitionTemplate,
    validThirdTransitionTemplate,
  ],
}

export const validFirstWorkflowTemplateResponse: WorkflowTemplate = {
  ...validFirstWorkflowTemplateRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validFirstUpdatedWorkflowTemplateRequest: WorkflowTemplateDto = {
  name: 'kyc_with_rejection',
  workflowType: WorkflowType.LINK,
  roles: ['ISSUER', 'INVESTOR'],
  states: [
    '__notStarted__',
    'invited',
    'kycSubmitted',
    'validated',
    'rejected',
  ],
  transitionTemplates: [
    validFirstTransitionTemplate,
    validSecondTransitionTemplate,
    validThirdTransitionTemplate,
    validFourthTransitionTemplate,
  ],
}

export const validFirstUpdatedWorkflowTemplateResponse: WorkflowTemplate = {
  ...validFirstUpdatedWorkflowTemplateRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validSecondWorkflowTemplateRequest: WorkflowTemplateDto = {
  name: 'kyc_without_transitions',
  workflowType: WorkflowType.LINK,
  roles: ['ISSUER', 'INVESTOR'],
  states: [
    '__notStarted__',
    'invited',
    'kycSubmitted',
    'validated',
    'rejected',
  ],
  transitionTemplates: [],
}

export const validSecondWorkflowTemplateResponse: WorkflowTemplate = {
  ...validSecondWorkflowTemplateRequest,
  id: 2,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validThirdWorkflowTemplateRequest: WorkflowTemplateDto = {
  name: 'kyc',
  workflowType: WorkflowType.LINK,
  roles: ['ISSUER', 'INVESTOR'],
  states: [
    '__notStarted__',
    'invited',
    'kycSubmitted',
    'validated',
    'rejected',
  ],
  transitionTemplates: [
    validFirstTransitionTemplate,
    validSecondTransitionTemplate,
    validThirdTransitionTemplate,
    validFourthTransitionTemplate,
  ],
}

export const validWorkflowTemplateRequests = [
  validFirstWorkflowTemplateRequest,
  validSecondWorkflowTemplateRequest,
]

export const validWorkflowTemplateResponses = [
  validFirstWorkflowTemplateResponse,
  validSecondWorkflowTemplateResponse,
]

// workflow instance

export const validWorkflowInstanceRequest: WorkflowInstanceDto = {
  idempotencyKey: null,
  name: 'invite',
  workflowType: WorkflowType.LINK,
  objectId: 'xxx',
  state: 'invited',
  role: 'ISSUER',
  workflowTemplateId: 1,
  transitionTemplates: [],
  userId: mockUserId,
  recipientId: 'xxx',
  brokerId: 'xxx',
  agentId: 'xxx',
  entityId: '51ee3ffd-3012-4410-a5d4-43d82f158e54',
  entityType: EntityType.PROJECT,
  wallet: null,
  date: new Date('2020-07-07T04:44:10.113Z'),
  assetClassKey: 'Evolved',
  quantity: 10000,
  price: 20,
  documentId: 'xxx',
  paymentId: 'Sg9Jejhg',
  offerId: 1,
  orderSide: OrderSide.SELL,
  data: {},
}

export const validWorkflowInstanceResponse: WorkflowInstance = {
  ...validWorkflowInstanceRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validUpdatedWorkflowInstanceRequest: Partial<WorkflowInstanceDto> = {
  name: 'submitKyc',
  workflowType: WorkflowType.LINK,
  objectId: 'xxx',
  state: 'kycSubmitted',
  role: 'INVESTOR',
  workflowTemplateId: 1,
  transitionTemplates: [],
  userId: mockUserId,
  recipientId: 'xxx',
  brokerId: 'xxx',
  agentId: 'xxx',
  entityId: '51ee3ffd-3012-4410-a5d4-43d82f158e54',
  entityType: EntityType.PROJECT,
  wallet: null,
  date: new Date('2020-07-07T04:44:10.113Z'),
  assetClassKey: 'Evolved',
  quantity: 10000,
  price: 20,
  documentId: 'xxx',
  paymentId: 'Sg9Jejhg',
  offerId: 1,
  orderSide: OrderSide.SELL,
  data: {},
}

export const validUpdatedWorkflowInstanceResponse: WorkflowInstance = {
  ...(validUpdatedWorkflowInstanceRequest as WorkflowInstanceDto),
  idempotencyKey: null,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validTwiceUpdatedWorkflowInstanceRequest: WorkflowInstanceDto = {
  idempotencyKey: undefined,
  name: 'validateKyc',
  workflowType: WorkflowType.LINK,
  objectId: 'xxx',
  state: 'validated',
  role: 'ISSUER',
  workflowTemplateId: 1,
  transitionTemplates: [],
  userId: mockUserId,
  recipientId: 'xxx',
  brokerId: 'xxx',
  agentId: 'xxx',
  entityId: '51ee3ffd-3012-4410-a5d4-43d82f158e54',
  entityType: EntityType.PROJECT,
  wallet: null,
  date: new Date('2020-07-07T04:44:10.113Z'),
  assetClassKey: 'Evolved',
  quantity: 10000,
  price: 20,
  documentId: 'xxx',
  paymentId: 'Sg9Jejhg',
  offerId: 1,
  orderSide: OrderSide.SELL,
  data: {},
}

export const validTwiceUpdatedWorkflowInstanceResponse: WorkflowInstance = {
  ...validTwiceUpdatedWorkflowInstanceRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// transition instance

export const validFirstTransitionInstanceRequest: TransitionInstanceDto = {
  name: 'invite',
  userId: mockUserId,
  workflowInstanceId: 1,
  fromState: NOT_STARTED,
  toState: 'invited',
  role: UserType.ISSUER,
}

export const validFirstTransitionInstanceResponse: TransitionInstance = {
  ...validFirstTransitionInstanceRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validFirstUpdatedTransitionInstanceRequest: TransitionInstanceDto = {
  name: 'rejectKyc',
  userId: mockUserId,
  workflowInstanceId: 1,
  fromState: 'validated',
  toState: 'rejected',
  role: UserType.ISSUER,
}

export const validFirstUpdatedTransitionInstanceResponse: TransitionInstance = {
  ...validFirstUpdatedTransitionInstanceRequest,
  id: 1,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validSecondTransitionInstanceRequest: TransitionInstanceDto = {
  name: 'submitKyc',
  userId: mockUserId,
  workflowInstanceId: 1,
  fromState: 'invited',
  toState: 'kycSubmitted',
  role: UserType.INVESTOR,
}

export const validSecondTransitionInstanceResponse: TransitionInstance = {
  ...validSecondTransitionInstanceRequest,
  id: 2,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validThirdTransitionInstanceRequest: TransitionInstanceDto = {
  name: 'validateKyc',
  userId: mockUserId,
  workflowInstanceId: 1,
  fromState: 'kycSubmitted',
  toState: 'validated',
  role: UserType.ISSUER,
}

export const validThirdTransitionInstanceResponse: TransitionInstance = {
  ...validThirdTransitionInstanceRequest,
  id: 3,
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const validTransitionInstanceRequests = [
  validFirstTransitionInstanceRequest,
  validSecondTransitionInstanceRequest,
]

export const validTransitionInstanceResponses = [
  validFirstTransitionInstanceResponse,
  validSecondTransitionInstanceResponse,
]
