// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isNil = (val: any): boolean => {
  return val === null || val === undefined;
};

export function envString(
  envName: string,
  defaultVal?: string
): string | undefined {
  const envVal = process.env[envName];

  if (isNil(envVal)) {
    if (!isNil(defaultVal)) {
      return defaultVal;
    }

    return undefined;
  }

  return envVal;
}

export function envInt(
  envName: string,
  defaultVal?: number
): number | undefined {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal;
    return undefined;
  }

  const res = parseInt(envVal);
  if (isNaN(res)) {
    throw new Error(
      `Failed to parse environment variable ${envName}=${envVal} as integer`
    );
  }

  return res;
}

export function envBool(
  envName: string,
  defaultVal?: boolean
): boolean | undefined {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal;
    return undefined;
  }

  switch (envVal.toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;

    default:
      throw new Error(
        `Failed to parse environment variable ${envName}=${envVal} as boolean`
      );
  }
}
