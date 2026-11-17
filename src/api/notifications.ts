import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from './client'
import type { components } from './schema'

export type AppNotification = components['schemas']['NotificationDto']

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
}

/** Unread count for the bell: polled every 60 s while the tab is visible. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: ({ signal }) =>
      apiRequest<{ count: number }>('/me/notifications/unread-count', { signal }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    select: (data) => data.count,
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ signal }) =>
      apiRequest<AppNotification[]>('/me/notifications?limit=100', { signal }),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<AppNotification>(`/me/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiRequest<{ updated: number }>('/me/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
