const DEFAULT_DATE_TIME_FORMAT = {
  // you can use undefined as first argument
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}

export const toDefaultDateTimeString = (date, locale, timeZone) => {
  return date.toLocaleString(
    locale ? locale : undefined,
    timeZone ? { timeZone: timeZone } : DEFAULT_DATE_TIME_FORMAT,
  )
}
