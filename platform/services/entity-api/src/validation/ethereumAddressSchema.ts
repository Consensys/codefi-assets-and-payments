import Joi from 'joi'
import { ethereumAddressRegEx } from '../utils/utils'

export const ethereumAddressSchema = Joi.string().regex(ethereumAddressRegEx)
