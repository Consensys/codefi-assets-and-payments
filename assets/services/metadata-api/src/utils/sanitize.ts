import xss from 'xss';

/**
 * iteratively sanitizes strings, arrays and objects
 * can be used with decorator @Transform(sanitize)
 * from class-transform
 */
export const sanitize = (param: {
  value: object | object[] | string | string[];
}) => {
  let valueType: string = typeof param.value;

  // javascript evaluates arrays as objects,
  // but we want to handle them separately
  if (valueType === 'object' && Array.isArray(param.value)) valueType = 'array';

  switch (valueType) {
    case 'object':
      // iterate over object keys
      const sanitizedValue = {};
      for (const key of Object.keys(param.value))
        sanitizedValue[key] = sanitize({ value: param.value[key] });
      return sanitizedValue;
    case 'array':
      // iterate over array elements
      return (param.value as any[]).map((elem: any) =>
        sanitize({ value: elem }),
      );
    case 'string':
      // iteration leaf
      // we pass an empty whitelist to bypass defaults (e.g. <br />)
      return xss(param.value as string, {
        whiteList: {},
      });
    default:
      // iteration leaf
      // other types are not sanitized (e.g. numbers, blobs)
      return param.value;
  }
};
