import ErrorService from 'src/utils/errorService';

export const getEnumValues = (enumObject: any): Array<any> => {
  const enumValues: string[] = Object.keys(enumObject).map(
    (enumKey) => enumObject[enumKey],
  );
  return enumValues;
};

export const checkValidEnumValue = (
  enumObject: any,
  enumValue: any,
): boolean => {
  const enumValues: Array<any> = getEnumValues(enumObject);
  return enumValues.includes(enumValue);
};

export const retrieveEnumKey = (enumObject: any, enumValue: any): any => {
  try {
    let key: any;
    let keyFound: boolean;
    Object.keys(enumObject).map((enumKey) => {
      if (enumObject[enumKey] === enumValue) {
        key = enumKey;
        keyFound = true;
      }
    });
    if (!keyFound) {
      ErrorService.throwError(`value ${enumValue} was not found in enum`);
    }
    return key;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'retrieving enum key',
      'retrieveEnumKey',
      false,
      500,
    );
  }
};
