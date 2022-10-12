import { ClientType, EntityStatus } from '@codefi-assets-and-payments/ts-types'
import Joi from 'joi'
import { paginatedQueryRequestProperties } from './paginatedQueryRequestProperties'

export const entityClientQueryRequestSchema = Joi.object({
  ...paginatedQueryRequestProperties,
  name: Joi.string(),
  type: Joi.string().valid(
    ClientType.Native,
    ClientType.NonInteractive,
    ClientType.RegularWeb,
    ClientType.SinglePage,
  ),
  status: Joi.string().valid(
    EntityStatus.Pending,
    EntityStatus.Confirmed,
    EntityStatus.Failed,
  ),
  clientId: Joi.string(),
})
