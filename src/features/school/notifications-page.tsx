import {
  Bell,
  BellOff,
  CheckCheck,
  CircleCheck,
  ClipboardList,
  ClipboardPen,
  LifeBuoy,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { errorMessage } from '@/api/errors'
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  type AppNotification,
} from '@/api/notifications'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'
import { DEFAULT_TIMEZONE, dateInZone, relativeDayTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { notificationTarget } from './notification-target'

const icons: Record<string, LucideIcon> = {
  grade: Star,
  homework_due: ClipboardPen,
  homework_checked: CircleCheck,
  homework_returned: ClipboardPen,
  quiz_unlocked: ClipboardList,
  checkpoint_passed: Trophy,
  needs_help: LifeBuoy,
}

export function NotificationsPage() {
  const list = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const navigate = useNavigate()
  const unread = list.data?.filter((n) => !n.readAt).length ?? 0
  const today = dateInZone(new Date(), DEFAULT_TIMEZONE)

  function open(n: AppNotification) {
    if (!n.readAt) markRead.mutate(n.id)
    const target = notificationTarget(n)
    if (target) void navigate(target)
  }

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        subtitle={
          list.data
            ? unread
              ? t('notifications.unreadCount', { count: unread })
              : t('notifications.allRead')
            : undefined
        }
        backTo={paths.home}
      />

      {unread > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => markAll.mutate()}
          loading={markAll.isPending}
        >
          {!markAll.isPending && <CheckCheck aria-hidden />}
          {t('notifications.markAll')}
        </Button>
      )}

      {list.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : list.isError ? (
        <ErrorState
          message={errorMessage(list.error)}
          onRetry={() => void list.refetch()}
          retrying={list.isFetching}
        />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t('notifications.empty')}
          description={t('notifications.emptyHint')}
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
          {list.data.map((n) => {
            const Icon = icons[n.type ?? ''] ?? Bell
            const isUnread = !n.readAt
            return (
              <li key={n.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 p-4 text-left transition-colors hover:bg-muted',
                    isUnread && 'bg-primary-soft/40',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-full',
                      isUnread
                        ? 'bg-primary-soft text-primary-soft-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block', isUnread ? 'font-semibold' : 'font-medium')}>
                      {n.title}
                      {isUnread && <span className="sr-only"> ({t('notifications.unread')})</span>}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                    )}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {relativeDayTime(n.createdAt, today, DEFAULT_TIMEZONE)}
                    </span>
                  </span>
                  {isUnread && (
                    <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
