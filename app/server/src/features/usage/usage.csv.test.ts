import { describe, expect, it } from 'vitest'
import { roundCents } from '../../shared/money.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import type { UsageRecord } from './usage.ts'
import { toUsageCsv } from './usage.csv.ts'
import { listMonth, type MonthlyUsage, type PricedUsageRecord } from './usage.query.ts'

const BOM = '\uFEFF'
const HEADER = 'Time,Project,Model,Input tokens,Cached input tokens,Output tokens,Cost (USD)'

const item = (overrides: Partial<PricedUsageRecord> = {}): PricedUsageRecord => ({
  id: 1,
  timestamp: '2026-09-30T18:00:00Z',
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 1000,
  outputTokens: 200,
  cachedInputTokens: 400,
  cost: 0.00423,
  ...overrides,
})

const usageOf = (items: PricedUsageRecord[]): MonthlyUsage => ({
  month: '2026-10',
  items,
  totalCost: roundCents(items.reduce((sum, row) => sum + row.cost, 0)),
})

/** Lines of the CSV without the BOM and the trailing line break. */
const linesOf = (csv: string): string[] => csv.replace(BOM, '').split('\r\n').slice(0, -1)

describe('toUsageCsv', () => {
  it('starts with the BOM and the header row, and every row ends with CRLF', () => {
    const csv = toUsageCsv(usageOf([item()]), 'Asia/Ho_Chi_Minh')

    expect(csv.startsWith(`${BOM}${HEADER}\r\n`)).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(csv.replaceAll('\r\n', '')).not.toContain('\n')
  })

  it('writes one row per item in the order of items', () => {
    const csv = toUsageCsv(
      usageOf([
        item({ id: 2, timestamp: '2026-10-02T08:00:00Z', project: 'newer' }),
        item({ id: 1, timestamp: '2026-10-01T08:00:00Z', project: 'older' }),
      ]),
      'UTC',
    )

    const lines = linesOf(csv)
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain(',newer,')
    expect(lines[2]).toContain(',older,')
  })

  it('writes the zoned time, text, token counts and cost with 8 decimals', () => {
    const csv = toUsageCsv(usageOf([item()]), 'Asia/Ho_Chi_Minh')

    expect(linesOf(csv)[1]).toBe('2026-10-01T01:00:00+07:00,support-bot,orion-mini,1000,400,200,0.00423000')
  })

  it('writes an empty cell for null cached tokens', () => {
    const csv = toUsageCsv(usageOf([item({ cachedInputTokens: null })]), 'UTC')

    expect(linesOf(csv)[1]).toBe('2026-09-30T18:00:00+00:00,support-bot,orion-mini,1000,,200,0.00423000')
  })

  it('quotes a project with a comma and doubles its quotes', () => {
    const csv = toUsageCsv(
      usageOf([item({ project: 'a,b' }), item({ id: 2, project: 'say "hi"' })]),
      'UTC',
    )

    const lines = linesOf(csv)
    expect(lines[1]).toContain(',"a,b",')
    expect(lines[2]).toContain(',"say ""hi""",')
  })

  it('quotes a project with a line break', () => {
    const csv = toUsageCsv(usageOf([item({ project: 'a\nb' })]), 'UTC')

    expect(csv).toContain(',"a\nb",')
  })

  it('prefixes a leading quote to text that starts with a formula character', () => {
    const csv = toUsageCsv(
      usageOf([
        item({ id: 1, project: '=SUM(A1)' }),
        item({ id: 2, project: '+1' }),
        item({ id: 3, project: '-1' }),
        item({ id: 4, project: '@cmd' }),
        item({ id: 5, project: '\tx' }),
        item({ id: 6, model: '=evil' }),
      ]),
      'UTC',
    )

    const lines = linesOf(csv)
    expect(lines[1]).toContain(",'=SUM(A1),")
    expect(lines[2]).toContain(",'+1,")
    expect(lines[3]).toContain(",'-1,")
    expect(lines[4]).toContain(",'@cmd,")
    expect(lines[5]).toContain(",'\tx,")
    expect(lines[6]).toContain(",'=evil,")
  })

  it('prefixes and quotes text that starts with a carriage return', () => {
    const csv = toUsageCsv(usageOf([item({ project: '\rx' })]), 'UTC')

    expect(csv).toContain(`,"'\rx",`)
  })

  it('prefixes before quoting when both apply', () => {
    const csv = toUsageCsv(usageOf([item({ project: '=a,b' })]), 'UTC')

    expect(csv).toContain(`,"'=a,b",`)
  })

  it('writes only the BOM and the header for an empty month', () => {
    const csv = toUsageCsv(usageOf([]), 'UTC')

    expect(csv).toBe(`${BOM}${HEADER}\r\n`)
  })

  it('has a cost column that sums to the total in cents', () => {
    const pricing: PriceTable = {
      'orion-mini': [{ inputPerMTok: 0.3, outputPerMTok: 2.5, cachedInputPerMTok: 0.03 }],
    }
    const records: UsageRecord[] = Array.from({ length: 400 }, (_, index) => ({
      id: index + 1,
      timestamp: `2026-09-${String((index % 28) + 1).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00Z`,
      model: 'orion-mini',
      project: `project-${index % 5}`,
      inputTokens: 1000 + ((index * 7919) % 90000),
      outputTokens: 50 + ((index * 104729) % 5000),
      cachedInputTokens: index % 3 === 0 ? null : (index * 31) % 1000,
    }))

    const usage = listMonth(records, '2026-09', 'UTC', pricing)
    const lines = linesOf(toUsageCsv(usage, 'UTC'))
    // A plain split is enough: generated projects and models have no commas, so no field is quoted.
    const costs = lines.slice(1).map((line) => Number(line.split(',').at(-1)))

    expect(costs).toHaveLength(usage.items.length)
    expect(usage.items.length).toBeGreaterThan(300)
    expect(roundCents(costs.reduce((sum, cost) => sum + cost, 0))).toBe(usage.totalCost)
  })
})
