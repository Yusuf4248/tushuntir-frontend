import type { AppNotification } from '@/api/notifications'
import { paths } from '@/routes/paths'

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && /^\d+$/.test(v)
      ? Number(v)
      : null

/** Where a notification leads, from its `data` (homeworkId, quizId, topicId, gradeId/subjectId). */
export function notificationTarget(n: AppNotification): string | null {
  const data = (n.data ?? {}) as Record<string, unknown>
  const homeworkId = num(data.homeworkId)
  const quizId = num(data.quizId)
  const topicId = num(data.topicId)
  const subjectId = num(data.subjectId)
  if (homeworkId) return paths.homeworkItem(homeworkId)
  if (n.type === 'quiz_unlocked' && quizId) return paths.quiz(quizId)
  if (n.type === 'checkpoint_passed' && topicId) return paths.topic(topicId)
  if (n.type === 'needs_help' && topicId) return paths.checkpoint(topicId)
  if (num(data.gradeId) || n.type === 'grade')
    return subjectId ? `${paths.grades}?subject=${subjectId}` : paths.grades
  if (quizId) return paths.quiz(quizId)
  if (topicId) return paths.topic(topicId)
  return null
}
