import * as Joi from '@hapi/joi'

import { transitionTemplateSchema } from './transitionTemplateSchema'
import { WorkflowType } from '../models/WorkflowType'
import { EntityType, OrderSide } from '../constants/enums'

export const workflowInstanceSchema = Joi.object({
  idempotencyKey: Joi.string().allow(null),
  name: Joi.string().allow(null),
  workflowType: Joi.string()
    .valid(
      WorkflowType.TOKEN,
      WorkflowType.ACTION,
      WorkflowType.NAV,
      WorkflowType.LINK,
      WorkflowType.ORDER,
      WorkflowType.OFFER,
      WorkflowType.EVENT,
    )
    .required(),
  tenantId: Joi.string().allow(null),
  objectId: Joi.string().allow(null),
  state: Joi.string().required(),
  role: Joi.string().required(),
  workflowTemplateId: Joi.number().allow(null),
  transitionTemplates: Joi.array()
    .items(transitionTemplateSchema)
    .required(),
  userId: Joi.string().allow(null),
  recipientId: Joi.string().allow(null),
  brokerId: Joi.string().allow(null),
  agentId: Joi.string().allow(null),
  entityId: Joi.string().allow(null),
  entityType: Joi.string()
    .valid(
      EntityType.TOKEN,
      EntityType.ASSET_CLASS,
      EntityType.ISSUER,
      EntityType.ADMIN,
      EntityType.PROJECT,
      EntityType.PLATFORM,
    )
    .allow(null),
  wallet: Joi.string().allow(null),
  date: Joi.date().allow(null),
  assetClassKey: Joi.string().allow(null),
  quantity: Joi.number().allow(null),
  price: Joi.number().allow(null),
  documentId: Joi.string().allow(null),
  paymentId: Joi.string().allow(null),
  offerId: Joi.number().allow(null),
  orderSide: Joi.string()
    .valid(OrderSide.BUY, OrderSide.SELL)
    .allow(null),
  data: Joi.object(),
})

export const workflowInstancesSchema = Joi.array()
  .items(
    workflowInstanceSchema.keys({
      id: Joi.number().required(),
    }),
  )
  .required()
