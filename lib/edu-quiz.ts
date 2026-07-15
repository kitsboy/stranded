const QUIZ_PROGRESS_KEY = 'stranded-edu-quiz-progress'

export type EduQuizProgress = {
  current: number
  score: number
  finished: boolean
  updatedAt: string
}

export function loadEduQuizProgress(): EduQuizProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QUIZ_PROGRESS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveEduQuizProgress(progress: Omit<EduQuizProgress, 'updatedAt'>): void {
  if (typeof window === 'undefined') return
  const payload: EduQuizProgress = { ...progress, updatedAt: new Date().toISOString() }
  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(payload))
}

export function clearEduQuizProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUIZ_PROGRESS_KEY)
}