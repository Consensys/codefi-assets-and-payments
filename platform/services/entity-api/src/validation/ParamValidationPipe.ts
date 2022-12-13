import Joi from 'joi'
import { PipeTransform } from '@nestjs/common'
import { ValidationException } from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'

export class ParamValidationPipe implements PipeTransform {
  constructor(readonly name: string, readonly schema: Joi.Schema) {}

  transform(value: any) {
    const { error, value: newValue } = this.schema.validate(value)
    if (error) {
      const errors = error.details.map((e) => e.message)
      throw new ValidationException(
        LocalErrorName.ControllerValidationException,
        errors.toString(),
        {
          value,
        },
      )
    }
    return newValue
  }
}
