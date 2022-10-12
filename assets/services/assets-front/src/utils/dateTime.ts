import { zonedTimeToUtc } from 'date-fns-tz';
import {
  IIssuanceElement,
  ISection,
} from 'routes/Issuer/AssetIssuance/insuanceDataType';

export type TimestampBreakdown = {
  timestamp: string;
  date: string;
  time: string;
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  timezone: string;
};

export const TIME_ELEMENT_SUFFIX = 'hour';
export const DATE_ELEMENT_SUFFIX = 'date';

const formatDateTimeProp = (number: number) => {
  return ('0' + number).slice(-2);
};

export const convertTimeAndDateToTz = ({
  time,
  date,
  timezone,
}: {
  time: string;
  date: string;
  timezone: string;
}): TimestampBreakdown => {
  const [hours, minutes] = time.split(':');

  // Date object is set in UTC by default
  const utcDate = new Date(date);

  const initialDate = new Date(
    utcDate.setUTCHours(parseInt(hours || '0')),
  ).setUTCMinutes(parseInt(minutes || '0'));
  const utcInitialDate = new Date(initialDate);

  const tzYear = utcInitialDate.getFullYear();
  const tzMonth = formatDateTimeProp(utcInitialDate.getMonth() + 1);
  const tzDay = formatDateTimeProp(utcInitialDate.getDate());
  const tzHours = formatDateTimeProp(utcInitialDate.getHours());
  const tzMinutes = formatDateTimeProp(utcInitialDate.getMinutes());

  return {
    timestamp: utcInitialDate.toString(),
    year: String(tzYear),
    month: tzMonth,
    day: tzDay,
    hours: tzHours,
    minutes: tzMinutes,
    date: `${tzYear}-${tzMonth}-${tzDay}`,
    time: `${tzHours}:${tzMinutes}`,
    timezone,
  };
};

export const convertTimeAndDateToUTC = ({
  time,
  date,
  timezone,
}: {
  time: string;
  date: string;
  timezone: string;
}): TimestampBreakdown => {
  const [hours, minutes] = time.split(':');

  // Initial date needs to be set in the user TZ
  // in order to avoid date different days due to TZ differences
  const initialDate = zonedTimeToUtc(date, timezone);

  const timezonedDate = new Date(
    new Date(initialDate.setHours(parseInt(hours || '0'))).setMinutes(
      parseInt(minutes || '0'),
    ),
  );

  const utcYear = timezonedDate.getUTCFullYear();
  const utcMonth = formatDateTimeProp(timezonedDate.getUTCMonth() + 1);
  const utcDay = formatDateTimeProp(timezonedDate.getUTCDate());
  const utcHours = formatDateTimeProp(timezonedDate.getUTCHours());
  const utcMinutes = formatDateTimeProp(timezonedDate.getUTCMinutes());

  return {
    timestamp: timezonedDate.toISOString(),
    year: String(utcYear),
    month: utcMonth,
    day: utcDay,
    hours: utcHours,
    minutes: utcMinutes,
    date: `${utcYear}-${utcMonth}-${utcDay}`,
    time: `${utcHours}:${utcMinutes}`,
    timezone,
  };
};

export const getDateTimeFormElementPrefix = (key: string) => {
  // -4 because both hour and date word have length 4.
  return key.slice(0, -4);
};

export const getTimeDateFormRelatedElement = (
  section: ISection,
  keyPrefix: string,
  endsWith: 'hour' | 'date',
) =>
  section.elements.find(
    (i) =>
      i.key.startsWith(keyPrefix) &&
      !i.key.endsWith(endsWith) &&
      i.key.endsWith(
        endsWith === TIME_ELEMENT_SUFFIX
          ? DATE_ELEMENT_SUFFIX
          : TIME_ELEMENT_SUFFIX,
      ),
  );

export const isTimeOrDateFormElement = (element: IIssuanceElement) =>
  element.key.endsWith(TIME_ELEMENT_SUFFIX) ||
  element.key.endsWith(DATE_ELEMENT_SUFFIX);
