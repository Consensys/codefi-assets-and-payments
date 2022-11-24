import Joi from 'joi'
import { ProductsEnum } from '@consensys/ts-types'

export const updateUserSchema = Joi.object({
  appMetadata: Joi.object(),
  tenantId: Joi.string(),
  entityId: Joi.string(),
  product: Joi.string().valid(
    ProductsEnum.assets,
    ProductsEnum.payments,
    ProductsEnum.compliance,
    ProductsEnum.staking,
  ),
  tenantRoles: Joi.array().items(Joi.string()),
})
