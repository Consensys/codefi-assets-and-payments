import { isNil } from './utils'

export function envString(envName: string, defaultVal?: string): string {
  const envVal = process.env[envName]
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal

    throw new Error(`Environment variable ${envName} not defined`)
  }
  return envVal
}

export function envInt(envName: string, defaultVal?: number): number {
  const envVal = process.env[envName]
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal

    throw new Error(`Environment variable ${envName} not defined`)
  }

  const res = parseInt(envVal)
  if (isNaN(res)) {
    throw new Error(
      `Failed to parse environment variable ${envName}=${envVal} as integer`,
    )
  }

  return res
}

export function envBool(envName: string, defaultVal?: boolean): boolean {
  const envVal = process.env[envName]
  if (isNil(envVal)) {
    if (!isNil(defaultVal)) return defaultVal

    throw new Error(`Environment variable ${envName} not defined`)
  }

  switch (envVal.toLowerCase()) {
    case 'true':
      return true
    case 'false':
      return false

    default:
      throw new Error(
        `Failed to parse environment variable ${envName}=${envVal} as boolean`,
      )
  }
}
