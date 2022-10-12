import { BigNumber } from 'bignumber.js'

export const unpadHex = (hex: string): string => {
  const hexBigNumber = new BigNumber(hex, 16)
  return `0x${hexBigNumber.toString(16)}`
}

export const toHex = (number: string): string => {
  return `0x${new BigNumber(number).toString(16)}`
}
