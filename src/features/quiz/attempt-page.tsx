import { useQuery } from '@tanstack/react-query'
import { SearchX } from 'lucide-react'
import { useParams } from 'react-router'

import { attemptKeys, fetchAttempt, startQuiz } from '@/api/attempts'
import { ApiError } from '@/api/errors'
import type { AttemptView } from '@/api/types'
import { t } from '@/lib/strings.uz'

import { attemptStorage } from './attempt-storage'
import { Blocked, StartSkeleton } from './quiz-start-page'
import { quizErrorMessage } from './quiz-errors'
import { QuizRunner } from './quiz-runner'

/**
 * Loads an attempt: GET /me/attempts/:id when the backend has it; otherwise this tab's copy
 * (a lesson quiz is re-read through "start", which returns the open attempt).
 */
async function loadAttempt(attemptId: number, signal: AbortSignal): Promise<AttemptView> {
  try {
    return await fetchAttempt(attemptId, signal)
  } catch (error) {
    const missingRoute = error instanceof ApiError && (error.status === 404 || error.status === 405)
    const snapshot = attemptStorage.load(attemptId)
    if (!missingRoute || !snapshot) throw error
    if (snapshot.kind === 'quiz') return startQuiz(snapshot.view.quizId)
    return snapshot.view
  }
}

export function AttemptPage() {
  const attemptId = Number(useParams().attemptId)
  const attempt = useQuery({
    queryKey: attemptKeys.view(attemptId),
    queryFn: ({ signal }) => loadAttempt(attemptId, signal),
    // The runner owns the answers once loaded; never refetch underneath it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (attempt.isPending) return <StartSkeleton />
  if (attempt.isError) {
    return (
      <Blocked
        icon={SearchX}
        title={t.quiz.attemptLost}
        description={
          attempt.error instanceof ApiError && attempt.error.status === 404
            ? t.quiz.attemptLostHint
            : quizErrorMessage(attempt.error)
        }
      />
    )
  }

  return <QuizRunner key={attemptId} view={attempt.data} />
}
