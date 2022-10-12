import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
  ArgumentMetadata,
} from '@nestjs/common'

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: any) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'object') {
      const { error } = this.schema.validate(value)
      if (error) {
        const errors = error.details.map((e) => e.message)
        throw new UnprocessableEntityException(`Validation error`, errors)
      }
    }
    return value
  }
}
