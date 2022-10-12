import Joi from 'joi';
import {
  FieldColumnTypes,
  SortCriteria,
} from 'src/modules/v2ApiCall/api.call.service/query';
import ErrorService from '../errorService';

export const sortSchema = Joi.object().pattern(
  Joi.string()
    .valid(...Object.values(FieldColumnTypes))
    .required(),
  Joi.string().valid('DESC', 'ASC').required(),
);

export const sortsSchema = Joi.array().items(sortSchema);

export function validateSorting(sorts: Array<SortCriteria>) {
  const { error } = sortsSchema.validate(sorts);
  if (error) {
    ErrorService.throwError(`Invalid sort schema key: ${error.message}`);
  }
}
