/** Safe localStorage JSON helpers — corrupt data must never crash the app. */

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function safeJsonArray<T>(raw: string | null): T[] {
  const parsed = safeJsonParse<unknown>(raw, [])
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

export function safeJsonObject<T extends Record<string, unknown>>(raw: string | null): T {
  const parsed = safeJsonParse<unknown>(raw, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : ({} as T)
}