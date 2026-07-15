const COMMANDS_KEY = 'stranded-recent-commands'
const MAX_COMMANDS = 8

export type RecentCommand = {
  id: string
  label: string
  kind: 'route' | 'preset' | 'site' | 'action'
  at: string
}

export function getRecentCommands(): RecentCommand[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COMMANDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMMANDS) : []
  } catch {
    return []
  }
}

export function recordRecentCommand(cmd: Omit<RecentCommand, 'at'>): void {
  if (typeof window === 'undefined') return
  const entry: RecentCommand = { ...cmd, at: new Date().toISOString() }
  const next = [
    entry,
    ...getRecentCommands().filter(c => c.id !== cmd.id),
  ].slice(0, MAX_COMMANDS)
  localStorage.setItem(COMMANDS_KEY, JSON.stringify(next))
}