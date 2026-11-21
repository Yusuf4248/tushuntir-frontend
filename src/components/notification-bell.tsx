import { Bell } from 'lucide-react'
import { Link } from 'react-router'

import { useUnreadCount } from '@/api/notifications'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

/** Bell with the unread count, for the tab pages' headers. */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadCount()
  const count = unread.data ?? 0
  return (
    <Link
      to={paths.notifications}
      aria-label={t('school.bell', { count })}
      className={cn(
        'relative grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted',
        className,
      )}
    >
      <Bell className="size-6" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-xs leading-none font-bold text-white tabular-nums ring-2 ring-background"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
