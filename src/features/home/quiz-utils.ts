import type { StudentQuiz } from '@/api/types'

function dueTime(quiz: StudentQuiz): number {
  return quiz.dueAt ? Date.parse(quiz.dueAt) : Number.POSITIVE_INFINITY
}

/** Available quizzes, the one due soonest first (no deadline last). */
export function byDueSoonest(quizzes: StudentQuiz[]): StudentQuiz[] {
  return [...quizzes].sort((a, b) => dueTime(a) - dueTime(b))
}

/** Overdue quizzes, the most recently missed first. */
export function byMostRecentlyDue(quizzes: StudentQuiz[]): StudentQuiz[] {
  return [...quizzes].sort((a, b) => dueTime(b) - dueTime(a))
}

/** True when the student started this quiz and has not submitted it yet. */
export function hasOpenAttempt(quiz: StudentQuiz): boolean {
  return quiz.attempt !== null && quiz.attempt.finishedAt === null
}
