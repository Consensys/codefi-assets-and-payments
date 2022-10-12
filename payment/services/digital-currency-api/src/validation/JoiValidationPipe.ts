import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common'
import Joi from '@hapi/joi'

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Joi.Schema) {}

  transform(value: any) {
    if (typeof value === 'object') {
      const { error } = this.schema.validate(value)
      if (error) {
        const errors = error.details.map((e) => e.message)
        throw new UnprocessableEntityException(
          `Validation error`,
          errors.toString(),
        )
      }
    }
    return value
  }
}
