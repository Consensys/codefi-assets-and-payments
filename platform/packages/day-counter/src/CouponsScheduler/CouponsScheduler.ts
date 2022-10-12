import { Frequency } from './../types/Frequency';

export async function couponsScheduler(
  maturityDate: Date,
  firstPaymentDate: Date,
  frequency: Frequency,
): Promise<Array<string>> {
  try {
    const maturityYear = new Date(maturityDate).getFullYear();
    const firstPaymentYear = new Date(firstPaymentDate).getFullYear();
    const firstPaymentDay = new Date(firstPaymentDate).getDate() + 1;
    const firstPaymentMonth = new Date(firstPaymentDate).getMonth();
    const scheduledDates: Array<string> = [];
    if (frequency === Frequency.YEARLY) {
      for (let i = firstPaymentYear; i <= maturityYear; i++) {
        scheduledDates.push(getDate(i, firstPaymentMonth, firstPaymentDay));
      }
      return scheduledDates;
    } else if (frequency === Frequency.QUARTERLY) {
      let currentYear = firstPaymentYear;
      let currentMonth = firstPaymentMonth;
      while (currentYear <= maturityYear) {
        scheduledDates.push(
          getDate(currentYear, currentMonth, firstPaymentDay),
        );
        currentMonth += 3;
        if (currentMonth > 12) {
          currentYear++;
          currentMonth -= 12;
        }
        if (currentYear === maturityYear && currentMonth > firstPaymentMonth) {
          break;
        }
      }
      return scheduledDates;
    } else if (frequency === Frequency.MONTHLY) {
      for (let i = firstPaymentYear; i <= maturityYear; i++) {
        const startMonth = i === firstPaymentYear ? firstPaymentMonth : 1;
        const endMonth = i === maturityYear ? firstPaymentMonth : 12;
        for (let j = startMonth; j <= endMonth; j++) {
          scheduledDates.push(getDate(i, j, firstPaymentDay));
        }
      }
      return scheduledDates;
    } else if (frequency === Frequency.WEEKLY) {
      let currentDate = firstPaymentDate;
      scheduledDates.push(
        getDate(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1,
        ),
      );
      while (currentDate <= maturityDate) {
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 7,
        );
        scheduledDates.push(
          getDate(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + 1,
          ),
        );
      }
      return scheduledDates;
    }
  } catch (error) {
    console.log('QuantLib error', error);
    throw error;
  }
}
function getDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString().substring(0, 10);
}
