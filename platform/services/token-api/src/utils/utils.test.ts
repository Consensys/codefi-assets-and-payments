import { getProperty, isNil, getAllSelfMethods } from './utils'

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

  describe('getProperty', () => {
    it('getProperty', () => {
      const objMock = { a: 2, b: 'test' }
      expect(getProperty(objMock, 'a')).toBe(2)
    })
  })

  describe('getAllSelfMethods', () => {
    it('getAllSelfMethods', () => {
      const objMock = { a: () => true, b: 'test' }
      expect(getAllSelfMethods(objMock)).toEqual(['a'])
    })
    it('getAllSelfMethods return empty', () => {
      const objMock = undefined
      expect(getAllSelfMethods(objMock)).toEqual([])
    })
  })
})
