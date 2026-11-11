import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { attemptKeys } from '@/api/attempts'
import { meKeys } from '@/api/me'
import type { AttemptView } from '@/api/types'
import { paths } from '@/routes/paths'

import { attemptStorage, snapshotFromView, type AttemptKind } from './attempt-storage'

/** Starts (or resumes) an attempt, caches it and opens the question screens. */
export function useStartAttempt(
  kind: AttemptKind,
  topicId: number | null,
  start: () => Promise<AttemptView>,
) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: start,
    onSuccess: (view) => {
      const previous = attemptStorage.load(view.attemptId)
      const fresh = snapshotFromView(view, kind, topicId)
      // Keep hint texts and misconceptions this tab saw earlier (the API may not resend them).
      attemptStorage.save({
        ...fresh,
        hints: { ...previous?.hints, ...fresh.hints },
        answers: { ...previous?.answers, ...fresh.answers },
        misconceptions: { ...previous?.misconceptions },
      })
      queryClient.setQueryData(attemptKeys.view(view.attemptId), view)
      // The quiz now has an open attempt (Home shows "Davom ettirish").
      void queryClient.invalidateQueries({ queryKey: meKeys.quizzes() })
      void navigate(paths.attempt(view.attemptId), { replace: true })
    },
  })
}
