import moment from 'moment'

export class InvalidAvroDateError extends Error {
  constructor(m: string) {
    super(m)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidAvroDateError.prototype)
  }
}

/**
 * Avro represents date as a number of days since January 1st 1970. This function
 * converts a number of days into a date.
 *
 * @param avroDate number of days since January 1st 1970
 * @returns Date object that represents this date
 */
export function convertAvroDate(avroDate: number): Date {
  if (avroDate < 0) {
    throw new InvalidAvroDateError(`Invalid Avro date: ${avroDate}`)
  }

  return moment(new Date(0)).add(avroDate, 'days').toDate()
}
