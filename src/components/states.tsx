import { CloudOff, Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = t.states.emptyTitle,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center',
        className,
      )}
    >
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

type ErrorStateProps = {
  message: string
  title?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({
  message,
  title = t.states.errorTitle,
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft/50 px-4 py-6 text-center',
        className,
      )}
    >
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <CloudOff className="size-6" aria-hidden />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry} loading={retrying}>
          {t.common.retry}
        </Button>
      )}
    </div>
  )
}
