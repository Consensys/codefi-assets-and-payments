import { PeriodGranularity } from '@codefi-assets-and-payments/ts-types'
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
} from 'date-fns'

export const getDateRangeByPeriod = async (
  startDate: Date,
  endDate: Date,
  interval: PeriodGranularity,
): Promise<Date[]> => {
  if (interval === PeriodGranularity.DAY) {
    const days = differenceInCalendarDays(endDate, startDate)

    return [...Array(days + 1).keys()].map((i) => addDays(startDate, i))
  }

  if (interval === PeriodGranularity.WEEK) {
    const weeks = differenceInCalendarWeeks(endDate, startDate)

    return [...Array(weeks + 1).keys()].map((i) => addWeeks(startDate, i))
  }

  if (interval === PeriodGranularity.MONTH) {
    const months = differenceInCalendarMonths(endDate, startDate)

    return [...Array(months + 1).keys()].map((i) => addMonths(startDate, i))
  }

  if (interval === PeriodGranularity.YEAR) {
    const years = differenceInCalendarYears(endDate, startDate)

    return [...Array(years + 1).keys()].map((i) => addYears(startDate, i))
  }
}
