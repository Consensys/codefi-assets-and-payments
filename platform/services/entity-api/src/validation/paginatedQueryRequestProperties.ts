import Joi from 'joi'

export const MAX_PAGINATED_LIMIT = 1000

export const paginatedQueryRequestProperties = {
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number()
    .integer()
    .min(0)
    .max(MAX_PAGINATED_LIMIT)
    .default(MAX_PAGINATED_LIMIT),
}
