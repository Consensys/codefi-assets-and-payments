import { ClientType } from '@consensys/ts-types'
import Joi from 'joi'

export const entityClientCreateRequestSchema = Joi.object({
  type: Joi.string()
    .valid(ClientType.NonInteractive, ClientType.SinglePage)
    .default(ClientType.SinglePage),
})
