import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// returns true if it has xor relation with the specified key in the constraint
@ValidatorConstraint({ name: 'xorConstraint', async: false })
export class XorConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    return (
      (!!propertyValue && !args.object[args.constraints[0]]) ||
      (!propertyValue && !!args.object[args.constraints[0]])
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `Failed XOR relation between "${args.property}" and "${args.constraints[0]}".`;
  }
}
