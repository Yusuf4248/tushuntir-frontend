import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** The mark: a "T" on a tile-blue square. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-9 shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M9 10h14v3h-5.5v11h-3V13H9z" className="fill-primary-foreground" />
    </svg>
  )
}

/** Mark + name in Unbounded. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo />
      <span className="font-display text-xl font-semibold tracking-tight">{t('app.name')}</span>
    </span>
  )
}
