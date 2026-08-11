import { createUndoStack } from './undo-stack'

const stack = createUndoStack<string[]>(40)

export function pushMissionSnapshot(ids: string[]) {
  stack.push([...ids])
}

export function undoMission(): string[] | null {
  return stack.undo()
}

export function redoMission(): string[] | null {
  return stack.redo()
}

export function canUndoMission(): boolean {
  return stack.canUndo()
}

export function canRedoMission(): boolean {
  return stack.canRedo()
}

export function peekMissionSnapshot(): string[] | null {
  return stack.peek()
}

export function clearMissionHistory() {
  stack.clear()
}
