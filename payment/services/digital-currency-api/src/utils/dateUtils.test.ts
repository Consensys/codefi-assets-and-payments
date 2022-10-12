import { PeriodGranularity } from '@codefi-assets-and-payments/ts-types'
import { getDateRangeByPeriod } from './dateUtils'

describe('dateUtils', () => {
  describe('getDateRangeByPeriod', () => {
    it('success - return array of days', async () => {
      const result = await getDateRangeByPeriod(
        new Date('05-01-2021'),
        new Date('05-04-2021'),
        PeriodGranularity.DAY,
      )
      expect(result.length).toBe(4)
    })

    it('success - return array of weeks', async () => {
      const result = await getDateRangeByPeriod(
        new Date('04-01-2021'),
        new Date('05-01-2021'),
        PeriodGranularity.WEEK,
      )
      expect(result.length).toBe(5)
    })

    it('success - return array of months', async () => {
      const result = await getDateRangeByPeriod(
        new Date('01-01-2021'),
        new Date('05-04-2021'),
        PeriodGranularity.MONTH,
      )
      expect(result.length).toBe(5)
    })

    it('success - return array of years', async () => {
      const result = await getDateRangeByPeriod(
        new Date('01-01-2019'),
        new Date('05-04-2021'),
        PeriodGranularity.YEAR,
      )
      expect(result.length).toBe(3)
    })
  })
})
