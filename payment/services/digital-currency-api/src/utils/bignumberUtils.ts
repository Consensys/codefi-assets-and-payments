import { BigNumber } from 'bignumber.js'

export const addHex = (hex1: string, hex2: string): string => {
  const hex1BigNumber = new BigNumber(hex1, 16)
  const hex2BigNumber = new BigNumber(hex2, 16)
  const result = hex1BigNumber.plus(hex2BigNumber)
  return `0x${result.toString(16)}`
}

export const subtractHex = (hex1: string, hex2: string): string => {
  const hex1BigNumber = new BigNumber(hex1, 16)
  const hex2BigNumber = new BigNumber(hex2, 16)
  const result = hex1BigNumber.minus(hex2BigNumber)
  return `0x${result.toString(16)}`
}

export const unpadHex = (hex: string): string => {
  const hexBigNumber = new BigNumber(hex, 16)
  return `0x${hexBigNumber.toString(16)}`
}

export const hexToString = (hex: string): string => {
  const hexBigNumber = new BigNumber(hex, 16)
  return hexBigNumber.toString()
}

export const stringToHex = (hex: string): string => {
  return `0x${new BigNumber(hex).toString(16)}`
}

export const isGreaterOrEqualToHex = (hex1: string, hex2: string): boolean => {
  const hex1BigNumber = new BigNumber(hex1, 16)
  const hex2BigNumber = new BigNumber(hex2, 16)
  const result = hex1BigNumber.isGreaterThanOrEqualTo(hex2BigNumber)
  return result
}

export const stringToBigNumber = (num: string): BigNumber => {
  return new BigNumber(num)
}
