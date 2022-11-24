import Joi from 'joi'
import { ProductsEnum } from '@consensys/ts-types'

export const inviteUserByEmailSchema = Joi.object({
  email: Joi.string().required(),
  name: Joi.string().required(),
  applicationClientId: Joi.string(),
  familyName: Joi.string(),
  givenName: Joi.string(),
  picture: Joi.string(),
  phoneNumber: Joi.string(),
  nickname: Joi.string(),
  roles: Joi.array().items(Joi.string()),
  password: Joi.string(),
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
