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

/** Formats `timestamp` as ISO 8601 in `timeZone` with its offset, e.g. `2026-10-01T01:00:00+07:00`. */
export const toZonedIsoString = (timestamp: string | Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(timestamp))
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? ''
  const offset = part('timeZoneName').replace('GMT', '') || '+00:00'
  const date = `${part('year')}-${part('month')}-${part('day')}`
  return `${date}T${part('hour')}:${part('minute')}:${part('second')}${offset}`
}

export const currentMonthKey = (timeZone: string, now: Date = new Date()): string =>
  toMonthKey(now, timeZone)
