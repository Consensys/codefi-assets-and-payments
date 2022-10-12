import { ClientType } from '@codefi-assets-and-payments/ts-types'
import Joi from 'joi'

export const entityClientCreateRequestSchema = Joi.object({
  type: Joi.string()
    .valid(ClientType.NonInteractive, ClientType.SinglePage)
    .default(ClientType.SinglePage),
})
