import { toChecksumAddress } from 'web3-utils'

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const isNil = (val: any) => {
  return val === null || val === undefined
}

export const getChecksumAddress = (address?: string): string | undefined => {
  return address ? toChecksumAddress(address) : undefined
}

export const ethereumAddressRegEx = /^0x[a-fA-F0-9]{40}$/
