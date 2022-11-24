import { ProductType } from '@consensys/ts-types'
import Joi from 'joi'

export const productsSchema = Joi.object(
  Object.keys(ProductType).reduce((validFields, key) => {
    validFields[key] = Joi.boolean()
    return validFields
  }, {}),
)
