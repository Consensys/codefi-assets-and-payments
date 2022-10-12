import { FileSystemInstance } from '../services/instances/FileSystemInstance'

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

export const flatten = <T>(nestedLists: T[][]): T[] => {
  return [].concat(...nestedLists)
}

export const removePrimitiveDuplicates = <T extends string | number>(
  data: T[],
): T[] => {
  return [...new Set(data)]
}

export const removeDuplicates = <T>(
  data: T[],
  getIdentifier: (item: T) => any,
): T[] => {
  return data.filter(
    (item, index) =>
      data.findIndex(
        (findItem) => getIdentifier(findItem) === getIdentifier(item),
      ) === index,
  )
}

export const joinNestedLists = <T>(
  nestedLists: T[][],
  getIdentifier: (item: T) => any,
): T[] => {
  const validLists = nestedLists.filter(
    (nestedList) => nestedList && nestedList.length,
  )

  return removeDuplicates(flatten(validLists), getIdentifier)
}

export const getFileAsString = async (
  filePath: string,
  fs: FileSystemInstance,
): Promise<string> => {
  return await fs.instance().readFileSync(filePath).toString()
}

export const arraysEqualIgnoringOrder = <T extends string | number>(
  first: T[],
  second: T[],
): boolean => {
  if (first.length !== second.length) return false
  return first.every((value) => second.includes(value))
}
