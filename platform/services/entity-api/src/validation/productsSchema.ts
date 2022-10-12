import { ProductType } from '@codefi-assets-and-payments/ts-types'
import Joi from 'joi'

export const productsSchema = Joi.object(
  Object.keys(ProductType).reduce((validFields, key) => {
    validFields[key] = Joi.boolean()
    return validFields
  }, {}),
)
