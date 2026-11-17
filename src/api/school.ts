import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from './client'
import { meKeys } from './me'
import { notificationKeys } from './notifications'
import type {
  Attendance,
  Grades,
  HomeworkDetail,
  HomeworkItem,
  HomeworkStatus,
  Timetable,
} from './types'

export const schoolKeys = {
  all: ['school'] as const,
  timetable: (week: string | null) => [...schoolKeys.all, 'timetable', week ?? 'current'] as const,
  attendance: (month: string | null) =>
    [...schoolKeys.all, 'attendance', month ?? 'current'] as const,
  grades: (termId: number | null) => [...schoolKeys.all, 'grades', termId ?? 'current'] as const,
  homeworkList: () => [...schoolKeys.all, 'homework'] as const,
  homework: (id: number) => [...schoolKeys.all, 'homework', id] as const,
}

const withQuery = (path: string, params: Record<string, string | number | null | undefined>) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params))
    if (v !== null && v !== undefined) q.set(k, String(v))
  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}

/** weekStart: any date of the week (YYYY-MM-DD); null = this week. */
export function useTimetable(weekStart: string | null) {
  return useQuery({
    queryKey: schoolKeys.timetable(weekStart),
    queryFn: ({ signal }) =>
      apiRequest<Timetable>(withQuery('/me/timetable', { weekStart }), { signal }),
    placeholderData: (previous) => previous,
  })
}

/** month: YYYY-MM; null = this month. */
export function useAttendance(month: string | null) {
  return useQuery({
    queryKey: schoolKeys.attendance(month),
    queryFn: ({ signal }) =>
      apiRequest<Attendance>(withQuery('/me/attendance', { month }), { signal }),
    placeholderData: (previous) => previous,
  })
}

/** All grades of a term (null = the current one); subjects are filtered on the client. */
export function useGrades(termId: number | null) {
  return useQuery({
    queryKey: schoolKeys.grades(termId),
    queryFn: ({ signal }) => apiRequest<Grades>(withQuery('/me/grades', { termId }), { signal }),
    placeholderData: (previous) => previous,
  })
}

/** All homework; the status filter is applied on the client so counts stay visible. */
export function useHomeworkList() {
  return useQuery({
    queryKey: schoolKeys.homeworkList(),
    queryFn: ({ signal }) => apiRequest<HomeworkItem[]>('/me/homework', { signal }),
  })
}

export function useHomework(id: number) {
  return useQuery({
    queryKey: schoolKeys.homework(id),
    queryFn: ({ signal }) => apiRequest<HomeworkDetail>(`/me/homework/${id}`, { signal }),
    enabled: Number.isInteger(id) && id > 0,
    // Submission file links are signed and expire hourly; keep them fresh while the page is open.
    refetchInterval: 20 * 60_000,
  })
}

/** Text replaces the saved text; files (if any) replace all saved files. */
export function useSubmitHomework(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ text, files }: { text?: string; files: File[] }) => {
      const form = new FormData()
      if (text !== undefined) form.append('text', text)
      for (const file of files) form.append('files', file, file.name)
      return apiRequest<HomeworkDetail>(`/me/homework/${id}/submission`, {
        method: 'POST',
        body: form,
      })
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(schoolKeys.homework(id), detail)
      void queryClient.invalidateQueries({ queryKey: schoolKeys.homeworkList() })
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      void queryClient.invalidateQueries({ queryKey: meKeys.all })
    },
  })
}

export type { HomeworkStatus }
