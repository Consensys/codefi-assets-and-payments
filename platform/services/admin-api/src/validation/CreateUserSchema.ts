import Joi from 'joi'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'

export const createUserSchema = Joi.object({
  email: Joi.string().required(),
  name: Joi.string().required(),
  applicationClientId: Joi.string(),
  familyName: Joi.string(),
  givenName: Joi.string(),
  picture: Joi.string(),
  phoneNumber: Joi.string(),
  nickname: Joi.string(),
  userId: Joi.string(),
  username: Joi.string(),
  verifyEmail: Joi.boolean().default(false),
  password: Joi.string(),
  connection: Joi.string(),
  appMetadata: Joi.object(),
  userMetadata: Joi.object(),
  phoneVerified: Joi.boolean().default(false),
  emailVerified: Joi.boolean().default(false),
  blocked: Joi.boolean().default(false),
  tenantId: Joi.string(),
  entityId: Joi.string(),
  roles: Joi.array().items(Joi.string()),
  product: Joi.string().valid(
    ProductsEnum.assets,
    ProductsEnum.payments,
    ProductsEnum.compliance,
    ProductsEnum.staking,
  ),
  tenantRoles: Joi.array().items(Joi.string()),
})
