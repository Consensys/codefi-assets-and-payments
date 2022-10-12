import { convertAvroDate } from './avro-utils'

describe('avro-utils', () => {
  describe('convertAvroDate', () => {
    it('0th day is 1st of January 1970', () => {
      expect(convertAvroDate(0)).toEqual(new Date(0))
    })

    it('1st day is 2nd of January 1970', () => {
      expect(convertAvroDate(1)).toEqual(new Date('1970-01-02'))
    })

    it('31st day is 1st of February 1970', () => {
      expect(convertAvroDate(31)).toEqual(new Date('1970-02-01'))
    })

    it('does not accept negative date', () => {
      expect(() => convertAvroDate(-1)).toThrow('Invalid Avro date: -1')
    })
  })
})
