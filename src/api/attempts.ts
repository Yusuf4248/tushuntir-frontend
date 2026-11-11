import { apiRequest } from './client'
import type {
  AnswerResult,
  AttemptHistoryItem,
  AttemptView,
  ConfirmResult,
  HintResult,
  Review,
  SubmitResult,
} from './types'

export const attemptKeys = {
  all: ['attempt'] as const,
  view: (attemptId: number) => [...attemptKeys.all, attemptId, 'view'] as const,
  result: (attemptId: number) => [...attemptKeys.all, attemptId, 'result'] as const,
  review: (attemptId: number) => [...attemptKeys.all, attemptId, 'review'] as const,
}

/** Starts a lesson quiz, or returns the open attempt. */
export function startQuiz(quizId: number): Promise<AttemptView> {
  return apiRequest<AttemptView>(`/me/quizzes/${quizId}/start`, { method: 'POST' })
}

/** Always creates a new 5-question practice attempt (limited to 10 per hour). */
export function startPractice(topicId: number): Promise<AttemptView> {
  return apiRequest<AttemptView>(`/me/topics/${topicId}/practice`, { method: 'POST' })
}

/** An open or finished attempt. May 404 on backends without this route yet. */
export function fetchAttempt(attemptId: number, signal?: AbortSignal): Promise<AttemptView> {
  return apiRequest<AttemptView>(`/me/attempts/${attemptId}`, { signal })
}

export function saveAnswer(
  attemptId: number,
  questionId: number,
  answer: string,
): Promise<AnswerResult> {
  return apiRequest<AnswerResult>(`/me/attempts/${attemptId}/answers`, {
    method: 'POST',
    body: { questionId, answer },
  })
}

export function requestHint(attemptId: number, questionId: number): Promise<HintResult> {
  return apiRequest<HintResult>(`/me/attempts/${attemptId}/questions/${questionId}/hint`, {
    method: 'POST',
  })
}

/** Idempotent: submitting again returns the same result, so it also re-reads a result. */
export function submitAttempt(attemptId: number): Promise<SubmitResult> {
  return apiRequest<SubmitResult>(`/me/attempts/${attemptId}/submit`, { method: 'POST' })
}

export function fetchReview(attemptId: number, signal?: AbortSignal): Promise<Review> {
  return apiRequest<Review>(`/me/attempts/${attemptId}/review`, { signal })
}

export function confirmMistake(
  attemptId: number,
  questionId: number,
  answer: string,
): Promise<ConfirmResult> {
  return apiRequest<ConfirmResult>(`/me/attempts/${attemptId}/confirm/${questionId}`, {
    method: 'POST',
    body: { answer },
  })
}

export function fetchAttemptHistory(
  params: { limit?: number; topicId?: number } = {},
  signal?: AbortSignal,
): Promise<AttemptHistoryItem[]> {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.topicId) query.set('topicId', String(params.topicId))
  const qs = query.toString()
  return apiRequest<AttemptHistoryItem[]>(`/me/attempts${qs ? `?${qs}` : ''}`, { signal })
}
