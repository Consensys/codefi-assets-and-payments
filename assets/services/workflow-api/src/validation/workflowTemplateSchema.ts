import * as Joi from '@hapi/joi'
import { transitionTemplateSchema } from './transitionTemplateSchema'
import { WorkflowType } from '../models/WorkflowType'

export const workflowTemplateSchema = Joi.object({
  name: Joi.string().required(),
  workflowType: Joi.string()
    .valid(
      WorkflowType.TOKEN,
      WorkflowType.ACTION,
      WorkflowType.NAV,
      WorkflowType.LINK,
      WorkflowType.ORDER,
      WorkflowType.OFFER,
    )
    .required(),
  roles: Joi.array()
    .items(Joi.string().required())
    .required(),
  states: Joi.array()
    .items(Joi.string().required())
    .required(),
  transitionTemplates: Joi.array()
    .items(transitionTemplateSchema)
    .required(),
})
