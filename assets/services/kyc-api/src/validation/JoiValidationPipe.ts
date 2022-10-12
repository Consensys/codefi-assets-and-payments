import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  UnprocessableEntityException,
} from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: any,
    private readonly requestType?: string,
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'object') {
      const { error } = !!this.requestType
        ? this.schema.validate(value, {
            context: { requestType: this.requestType },
          })
        : this.schema.validate(value);

      if (error) {
        const errors = error.details.map((e) => e.message);
        throw new UnprocessableEntityException(`Validation error`, errors);
      }
    }
    return value;
  }
}
