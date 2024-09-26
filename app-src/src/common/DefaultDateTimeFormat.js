/**
 * Default date-time format options.
 */
const DEFAULT_DATE_TIME_FORMAT = {
  // you can use undefined as first argument
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}
/**
 * Converts a Date object to a string using the default date-time format.
 *
 * @param {Date} date - The date to format.
 * @param {string} [locale] - Optional locale string for formatting.
 * @param {string} [timeZone] - Optional time zone string for formatting.
 * @returns {string} The formatted date-time string.
 */
export const toDefaultDateTimeString = (date, locale, timeZone) => {
  return date.toLocaleString(
    locale ? locale : undefined,
    timeZone ? { timeZone: timeZone } : DEFAULT_DATE_TIME_FORMAT,
  )
}
