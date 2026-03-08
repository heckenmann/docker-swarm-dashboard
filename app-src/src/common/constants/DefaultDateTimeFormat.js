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
 * Converts a Date object or date string to a string using the default date-time format.
 *
 * @param {Date|string} date - The date to format (Date object or ISO string).
 * @param {string} [locale] - Optional locale string for formatting.
 * @param {string} [timeZone] - Optional time zone string for formatting.
 * @returns {string} The formatted date-time string, or '-' if date is undefined/null.
 */
export const toDefaultDateTimeString = (date, locale, timeZone) => {
  // Handle undefined, null, or empty values
  if (!date) {
    return '-'
  }

  // Convert string dates to Date objects
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Check if valid Date object
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '-'
  }

  return dateObj.toLocaleString(
    locale ? locale : undefined,
    timeZone ? { timeZone: timeZone } : DEFAULT_DATE_TIME_FORMAT,
  )
}
