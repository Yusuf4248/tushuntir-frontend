import { ApiError, errorMessage } from '@/api/errors'
import { t } from '@/lib/strings.uz'

export type QuizProblem = 'deadline' | 'submitted' | 'locked' | 'no_questions' | 'other'

/** The backend uses 409 for several cases; its (English) message tells them apart. */
export function quizProblem(error: unknown): QuizProblem {
  if (!(error instanceof ApiError) || error.status !== 409) return 'other'
  const message = error.serverMessage?.toLowerCase() ?? ''
  if (message.includes('deadline')) return 'deadline'
  if (message.includes('submitted')) return 'submitted'
  if (message.includes('opens when')) return 'locked'
  if (message.includes('no approved questions') || message.includes('no practice questions')) {
    return 'no_questions'
  }
  return 'other'
}

export function quizErrorMessage(error: unknown): string {
  switch (quizProblem(error)) {
    case 'deadline':
      return t.quiz.deadlinePassed
    case 'submitted':
      return t.quiz.doneTitle
    case 'locked':
      return t.quiz.locked
    case 'no_questions':
      return t.quiz.noQuestions
    default:
      return errorMessage(error)
  }
}
