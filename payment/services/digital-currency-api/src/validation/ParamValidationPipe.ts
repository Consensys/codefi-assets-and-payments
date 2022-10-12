import Joi from '@hapi/joi'
import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common'

@Injectable()
export class ParamValidationPipe implements PipeTransform {
  constructor(readonly name: string, readonly schema: Joi.Schema) {}

  transform(value: any) {
    const { error } = this.schema.validate(value)
    if (error) {
      const errors = error.details.map((e) => e.message)
      throw new UnprocessableEntityException(
        'Validation error',
        `Invalid "${this.name}" parameter "${value}": ${errors.toString()}`,
      )
    }
    return value
  }
}
