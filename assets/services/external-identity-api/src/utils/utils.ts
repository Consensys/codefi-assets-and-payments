export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const isNil = (val: any): boolean => {
  return val === null || val === undefined
}
