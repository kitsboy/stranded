/** Safe localStorage JSON helpers — corrupt data must never crash the app. */

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

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