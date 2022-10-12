import Joi from 'joi'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'

export const createClientSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  appType: Joi.string(),
  isEmailOnly: Joi.boolean(),
  clientMetadata: Joi.object(),
  logoUri: Joi.string(),
  callbacks: Joi.array().items(Joi.string()),
  allowedLogoutUrls: Joi.array().items(Joi.string()),
  webOrigins: Joi.array().items(Joi.string()),
  allowedOrigins: Joi.array().items(Joi.string()),
  grantTypes: Joi.array().items(Joi.string()),
  jwtConfiguration: Joi.object(),
  sso: Joi.boolean().default(false),
  initiateLoginUri: Joi.string(),
  tenantId: Joi.string(),
  entityId: Joi.string(),
  product: Joi.string().valid(
    ProductsEnum.assets,
    ProductsEnum.payments,
    ProductsEnum.compliance,
    ProductsEnum.staking,
  ),
})
