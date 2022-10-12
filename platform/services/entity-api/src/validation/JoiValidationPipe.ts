import { ValidationException } from '@codefi-assets-and-payments/error-handler'
import { PipeTransform } from '@nestjs/common'
import Joi from 'joi'
import { LocalErrorName } from '../LocalErrorNameEnum'

export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Joi.Schema) {}

  transform(value: any) {
    if (typeof value === 'object') {
      const { error, value: newValue } = this.schema.validate(value)
      if (error) {
        const errors = error.details.map((e) => e.message)
        throw new ValidationException(
          LocalErrorName.ControllerValidationException,
          errors.toString(),
          value,
        )
      }
      return newValue
    }
    return value
  }
}
