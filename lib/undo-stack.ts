export type UndoStack<T> = {
  push: (value: T) => void
  undo: () => T | null
  redo: () => T | null
  canUndo: () => boolean
  canRedo: () => boolean
  peek: () => T | null
  clear: () => void
}

export function createUndoStack<T>(limit = 20): UndoStack<T> {
  const past: T[] = []
  const future: T[] = []
  let current: T | null = null

  return {
    push(value: T) {
      if (current !== null) past.push(current)
      while (past.length > limit) past.shift()
      current = value
      future.length = 0
    },
    undo() {
      if (!past.length || current === null) return null
      future.push(current)
      current = past.pop() as T
      return current
    },
    redo() {
      if (!future.length || current === null) return null
      past.push(current)
      current = future.pop() as T
      return current
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    peek: () => current,
    clear() {
      past.length = 0
      future.length = 0
      current = null
    },
  }
}
