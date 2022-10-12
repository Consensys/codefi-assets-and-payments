export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const isNil = (val: any) => {
  return val === null || val === undefined
}
