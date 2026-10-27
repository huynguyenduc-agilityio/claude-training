import { toZonedIsoString } from '../../shared/time.ts'
import type { MonthlyUsage } from './usage.query.ts'

const BOM = '\uFEFF'
const LINE_BREAK = '\r\n'
const HEADER = [
  'Time',
  'Project',
  'Model',
  'Input tokens',
  'Cached input tokens',
  'Output tokens',
  'Cost (USD)',
]

const FORMULA_START = /^[=+\-@\t\r]/
const NEEDS_QUOTES = /[,"\r\n]/

/** Neutralizes spreadsheet formulas, then quotes the field when RFC 4180 requires it. */
const escapeText = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/** UTF-8 CSV with BOM and CRLF line ends: a header row, then one row per item in item order. */
export const toUsageCsv = (usage: MonthlyUsage, timeZone: string): string => {
  const rows = usage.items.map((item) =>
    [
      toZonedIsoString(item.timestamp, timeZone),
      escapeText(item.project),
      escapeText(item.model),
      String(item.inputTokens),
      item.cachedInputTokens === null ? '' : String(item.cachedInputTokens),
      String(item.outputTokens),
      item.cost.toFixed(8),
    ].join(','),
  )
  return BOM + [HEADER.join(','), ...rows].map((line) => line + LINE_BREAK).join('')
}
