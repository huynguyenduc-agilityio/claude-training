import { ValidationError } from '../../shared/errors.ts'
import { isKnownModel, type PriceTable } from '../pricing/pricing.ts'
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

const requireNonNegative = (value: number, field: string): number => {
  if (value < 0) throw new ValidationError(`${field} must not be negative`)
  return value
}

// A larger count cannot be read back from the database (node:sqlite throws a RangeError).
const requireSafe = (value: number, field: string): number => {
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new ValidationError(`${field} must not exceed ${Number.MAX_SAFE_INTEGER}`)
  }
  return value
}

const requireCount = (body: Record<string, unknown>, field: string): number =>
  requireSafe(requireNonNegative(requireInteger(body, field), field), field)

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
  if (!isKnownModel(pricing, model)) throw new ValidationError(`Unknown model: ${model}`)

  const cached = input.cachedInputTokens
  if (cached !== undefined && cached !== null && !isInteger(cached)) {
    throw new ValidationError('cachedInputTokens must be an integer')
  }
  if (isInteger(cached)) {
    requireSafe(requireNonNegative(cached, 'cachedInputTokens'), 'cachedInputTokens')
  }

  const project = requireString(input, 'project')
  const inputTokens = requireCount(input, 'inputTokens')
  const outputTokens = requireCount(input, 'outputTokens')
  // Cached tokens are part of the input tokens, so more cached than input gives a negative cost.
  if (isInteger(cached) && cached > inputTokens) {
    throw new ValidationError('cachedInputTokens must not exceed inputTokens')
  }

  return {
    timestamp: new Date(timestamp).toISOString(),
    model,
    project,
    inputTokens,
    outputTokens,
    cachedInputTokens: cached ?? null,
  }
}
