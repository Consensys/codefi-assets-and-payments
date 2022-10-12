import QuantLib from 'quantlib-wasm';

import { dayConvention } from '../types/DayCounterConventions';

export async function dayCounter(
  startDate: string,
  endDate: string,
  convention: dayConvention,
): Promise<number> {
  try {
    let dayCounter = 0;
    const quantLib = await QuantLib();
    const {
      Date,
      Actual365Fixed,
      ActualActual,
      Thirty360,
      Actual360,
    } = quantLib;

    const start = Date.fromISOString(startDate);
    const end = Date.fromISOString(endDate);

    switch (convention) {
      case dayConvention.Actual365Fixed:
        const actual365 = new Actual365Fixed();
        dayCounter = actual365.dayCount(start, end);
        break;
      case dayConvention.ActualActual:
        const actualActual = new ActualActual();
        dayCounter = actualActual.dayCount(start, end);
        break;
      case dayConvention.Thirty360:
        const thirty360 = new Thirty360();
        dayCounter = thirty360.dayCount(start, end);
        break;
      case dayConvention.Thirty360SIA:
        const thirty360SIA = new Actual360();
        dayCounter = thirty360SIA.dayCount(start, end);
        break;
      default:
        throw new Error('Day counter convention not found');
    }

    [start, end].forEach((arg) => arg.delete());
    return dayCounter;
  } catch (error) {
    console.log('QuantLib error', error);
    throw error;
  }
}
