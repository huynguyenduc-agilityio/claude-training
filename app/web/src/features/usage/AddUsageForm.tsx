import { type FormEvent, useEffect, useState } from 'react'
import { createUsage, fetchModels } from '../../shared/api.ts'
import { thisMonth } from '../../shared/format.ts'

const pad = (value: number) => String(value).padStart(2, '0')

/** Current local time as YYYY-MM-DDTHH:mm, the value format of datetime-local. */
const nowLocal = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

// A blank field is null, not 0: Number('') is 0, which would pass as a real count.
const toCount = (text: string): number | null => (text.trim() === '' ? null : Number(text))

// Blank stays blank so the API answers. An unparseable value is sent as typed so the API rejects it.
const toTimestamp = (local: string): { sent: string; date: Date | null } => {
  if (local === '') return { sent: '', date: null }
  const date = new Date(local)
  if (Number.isNaN(date.getTime())) return { sent: local, date: null }
  return { sent: date.toISOString(), date }
}

export const AddUsageForm = ({ onAdded }: { onAdded: () => void }) => {
  const [models, setModels] = useState<string[]>([])
  const [time, setTime] = useState(nowLocal)
  const [model, setModel] = useState('')
  const [project, setProject] = useState('')
  const [inputTokens, setInputTokens] = useState('')
  const [cachedTokens, setCachedTokens] = useState('')
  const [outputTokens, setOutputTokens] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchModels()
      .then((list) => {
        if (cancelled) return
        setModels(list)
        setModel((current) => current || list[0] || '')
      })
      .catch((failure: Error) => {
        if (!cancelled) setError(failure.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { sent, date } = toTimestamp(time)
    setSubmitting(true)
    try {
      await createUsage({
        timestamp: sent,
        model,
        project,
        inputTokens: toCount(inputTokens),
        cachedInputTokens: toCount(cachedTokens),
        outputTokens: toCount(outputTokens),
      })
      setSuccess(`Record added to ${thisMonth(date ?? new Date(sent))}.`)
      setError(null)
      setInputTokens('')
      setCachedTokens('')
      setOutputTokens('')
      onAdded()
    } catch (failure) {
      setSuccess(null)
      setError(failure instanceof Error ? failure.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2>Add usage record</h2>
      <form noValidate onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Time
            <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project
            <input type="text" value={project} onChange={(e) => setProject(e.target.value)} />
          </label>
          <label>
            Input tokens
            <input
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
            />
          </label>
          <label>
            Cached input tokens (optional)
            <input
              type="number"
              value={cachedTokens}
              onChange={(e) => setCachedTokens(e.target.value)}
            />
          </label>
          <label>
            Output tokens
            <input
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(e.target.value)}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            Add record
          </button>
          {success && <span className="success">{success}</span>}
          {error && (
            <span className="error" role="alert">
              {error}
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
