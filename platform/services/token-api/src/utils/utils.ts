export const isNil = (val: any) => {
  return val === null || val === undefined
}

export const getProperty = <T, K extends keyof T>(obj: T, key: K) => {
  return obj[key]
}

export const getAllSelfMethods = (classToCheck: any): string[] => {
  try {
    return Object.getOwnPropertyNames(classToCheck).filter(
      (val, idx, arr) =>
        arr.indexOf(val) === idx && typeof classToCheck[val] === 'function',
    )
  } catch (e) {
    return []
  }
}
