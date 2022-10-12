export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const isNil = <T>(val: T) => {
  return val === null || val === undefined
}
