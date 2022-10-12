import { ValidationOptions, ValidateBy, buildMessage } from 'class-validator';
import { isAddress } from 'web3-utils';

export const IS_ETHEREUM_ADDRESS = 'isEthereumAddress';

/**
 * Checks if a given string is a valid Ethereum address. It will also check the checksum, if the address has upper and lowercase letters.
 * If given value is not a string, then it returns false.
 */
export function isEthereumAddress(value: unknown): boolean {
  return typeof value === 'string' && isAddress(value);
}

/**
 * Checks if a given string is a valid Ethereum address. It will also check the checksum, if the address has upper and lowercase letters.
 * If given value is not a string, then it returns false.
 */
export function IsEthereumAddress(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_ETHEREUM_ADDRESS,
      validator: {
        validate: (value) => isEthereumAddress(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be an Ethereum address',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
