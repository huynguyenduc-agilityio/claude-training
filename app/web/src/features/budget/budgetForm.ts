import { ApiError } from '../../shared/api.ts'

// A blank field is null, not 0: Number('') is 0, which would pass as a real amount.
// Nothing else is checked here; the API decides what is valid.
export const toBudgetAmount = (text: string): number | null =>
  text.trim() === '' ? null : Number(text)

/**
 * The row message for a failed Save or Remove. A 4xx answer shows the API's text alone. No response,
 * or a 5xx answer, gets the prefix.
 */
export const failureMessage = (error: unknown, verb: 'save' | 'remove'): string => {
  const text = error instanceof Error ? error.message : 'Request failed'
  if (error instanceof ApiError && error.status < 500) return text
  return `Could not ${verb}: ${text}`
}
