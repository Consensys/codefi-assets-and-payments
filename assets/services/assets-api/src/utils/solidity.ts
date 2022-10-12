import ErrorService from 'src/utils/errorService';

export const checkSolidityBytes32 = (bytes32String: string) => {
  if (!bytes32String) {
    ErrorService.throwError('invalid solidity bytes32 string: undefined');
  }
  if (bytes32String.length !== 66) {
    ErrorService.throwError(
      `invalid solidity bytes32 string ${bytes32String}: shall be 32 bytes long (${
        (bytes32String.length - 2) / 2
      } instead)`,
    );
  }
  if (!bytes32String.startsWith('0x')) {
    ErrorService.throwError(
      `invalid solidity bytes32 string ${bytes32String}: shall start with '0x'`,
    );
  }
};
