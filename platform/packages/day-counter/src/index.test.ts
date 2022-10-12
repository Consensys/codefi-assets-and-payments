import { dayCounter } from './DayCounter/DayCounter';

import { dayConvention } from './types/DayCounterConventions';

describe('test', () => {
  it('test', async () => {
    const data = await dayCounter(
      '2021-11-21T12:20:20.487Z',
      '2021-12-21T12:20:20.487Z',
      dayConvention.Thirty360,
    );
    expect(data).toEqual(30);
  });
});
