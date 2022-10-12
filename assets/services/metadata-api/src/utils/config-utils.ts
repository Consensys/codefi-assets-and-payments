export const isNil = (val: any): boolean => {
  return val === null || val === undefined;
};

export function envString(envName: string, defaultVal?: string): string {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal as string;

    throw new Error(`Environment variable ${envName} not defined`);
  }
  return envVal as string;
}

export function envInt(envName: string, defaultVal?: number): number {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal as number;

    throw new Error(`Environment variable ${envName} not defined`);
  }

  const res = parseInt(envVal as string);
  if (isNaN(res)) {
    throw new Error(
      `Failed to parse environment variable ${envName}=${envVal} as integer`,
    );
  }

  return res;
}

export function envBool(envName: string, defaultVal?: boolean): boolean {
  const envVal = process.env[envName];
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) {
      return Boolean(defaultVal);
    }

    throw new Error(`Environment variable ${envName} not defined`);
  }

  switch ((envVal as string).toLowerCase()) {
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
