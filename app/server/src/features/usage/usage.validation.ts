import { ValidationError } from '../../shared/errors.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import type { NewUsageRecord } from './usage.ts'

const isInteger = (value: unknown): value is number => Number.isInteger(value)

const requireString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} is required`)
  }
  return value
}

const requireInteger = (body: Record<string, unknown>, field: string): number => {
  const value = body[field]
  if (!isInteger(value)) throw new ValidationError(`${field} must be an integer`)
  return value
}

export const parseNewUsageRecord = (body: unknown, pricing: PriceTable): NewUsageRecord => {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Body must be a JSON object')
  }
  const input = body as Record<string, unknown>

  const timestamp = requireString(input, 'timestamp')
  if (Number.isNaN(Date.parse(timestamp))) {
    throw new ValidationError('timestamp must be an ISO 8601 date')
  }

  const model = requireString(input, 'model')
  if (!pricing[model]) throw new ValidationError(`Unknown model: ${model}`)

  const cached = input.cachedInputTokens
  if (cached !== undefined && cached !== null && !isInteger(cached)) {
    throw new ValidationError('cachedInputTokens must be an integer')
  }

  return {
    timestamp: new Date(timestamp).toISOString(),
    model,
    project: requireString(input, 'project'),
    inputTokens: requireInteger(input, 'inputTokens'),
    outputTokens: requireInteger(input, 'outputTokens'),
    cachedInputTokens: cached ?? null,
  }
}
