export const formatUsd = (amount: number, fractionDigits = 2): string =>
  amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

export const formatTokens = (count: number | null): string =>
  count === null ? '—' : count.toLocaleString('en-US')

export const formatDateTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Current month as YYYY-MM in the browser's local time. */
export const thisMonth = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
