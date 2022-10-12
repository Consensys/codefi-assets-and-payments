export const isNil = (val: any): boolean => {
  return val === null || val === undefined;
};

export function envBool(envName: string, defaultVal?: boolean): boolean {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) {
      return defaultVal;
    }

    throw new Error(`Environment variable ${envName} not defined`);
  }

  switch (envVal.toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;

    default:
      throw new Error(
        `Failed to parse environment variable ${envName}=${envVal} as boolean`,
      );
  }
}
