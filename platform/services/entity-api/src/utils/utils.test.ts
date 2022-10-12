import { getChecksumAddress, isNil, sleep } from './utils'

const addressWithChecksum = '0x87Ea0683442a78F6030fF5a569165e1B91fcFcb5'
const addressWithoutChecksum = addressWithChecksum.toLowerCase()

describe('utils', () => {
  describe('isNil', () => {
    it('undefined is nil', () => {
      expect(isNil(undefined)).toBe(true)
    })

    it('null is nil', () => {
      expect(isNil(null)).toBe(true)
    })

    it('false is nil', () => {
      expect(isNil(false)).toBe(false)
    })
  })

  describe('sleep', () => {
    it('sleep', async () => {
      await sleep(0)
    })
  })

  describe('getChecksumAddress', () => {
    it('empty address returns undefined', () => {
      expect(getChecksumAddress(undefined)).toBe(undefined)
      expect(getChecksumAddress(null)).toBe(undefined)
      expect(getChecksumAddress('')).toBe(undefined)
    })

    it('valid address without checksum returns address with checksum', () => {
      expect(getChecksumAddress(addressWithoutChecksum)).toBe(
        addressWithChecksum,
      )
    })

    it('valid address with checksum returns same address', () => {
      expect(getChecksumAddress(addressWithChecksum)).toBe(addressWithChecksum)
    })

    it('invalid address throws', () => {
      expect(() => {
        getChecksumAddress('invalid')
      }).toThrow()
    })
  })
})
