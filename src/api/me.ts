import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from './client'
import type { FinishLessonResponse, MasteryList, QuizList, Today, WeakTopic } from './types'

export const meKeys = {
  all: ['me'] as const,
  today: () => [...meKeys.all, 'today'] as const,
  quizzes: () => [...meKeys.all, 'quizzes'] as const,
  weakTopics: () => [...meKeys.all, 'weak-topics'] as const,
  mastery: () => [...meKeys.all, 'mastery'] as const,
}

// Lesson status and quiz unlocks change with the clock, so these poll once a minute.
const LIVE = { refetchInterval: 60_000 } as const

export function useToday() {
  return useQuery({
    queryKey: meKeys.today(),
    queryFn: ({ signal }) => apiRequest<Today>('/me/today', { signal }),
    ...LIVE,
  })
}

export function useQuizzes() {
  return useQuery({
    queryKey: meKeys.quizzes(),
    queryFn: ({ signal }) => apiRequest<QuizList>('/me/quizzes', { signal }),
    ...LIVE,
  })
}

export function useWeakTopics() {
  return useQuery({
    queryKey: meKeys.weakTopics(),
    queryFn: ({ signal }) => apiRequest<WeakTopic[]>('/me/weak-topics', { signal }),
  })
}

export function useMastery() {
  return useQuery({
    queryKey: meKeys.mastery(),
    queryFn: ({ signal }) => apiRequest<MasteryList>('/me/mastery', { signal }),
  })
}

/** Demo only (backend DEMO_MODE): ends a lesson now so its quiz unlocks. */
export function useFinishLessonDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lessonId: number) =>
      apiRequest<FinishLessonResponse>(`/demo/finish-lesson/${lessonId}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKeys.all }),
  })
}
