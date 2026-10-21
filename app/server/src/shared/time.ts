const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/

export const isMonthKey = (value: string): boolean => MONTH_KEY.test(value)

/** Returns the `YYYY-MM` month that `timestamp` falls in, seen from `timeZone`. */
export const toMonthKey = (timestamp: string | Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(timestamp))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  return `${year}-${month}`
}

export const currentMonthKey = (timeZone: string, now: Date = new Date()): string =>
  toMonthKey(now, timeZone)
