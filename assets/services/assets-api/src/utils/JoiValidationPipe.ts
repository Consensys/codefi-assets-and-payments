import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema) {}

  transform(value) {
    if (typeof value === 'object') {
      const { error } = this.schema.validate(value);
      if (error) {
        const errors = error.details.map((e) => e.message);
        throw new UnprocessableEntityException('Validation error', errors);
      }
    }
    return value;
  }
}
