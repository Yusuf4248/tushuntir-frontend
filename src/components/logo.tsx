import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * The Tushuntir mark: a speech bubble with a voice wave and a tick (public/brand/*.svg, same
 * geometry). Its colours come from the --logo-* tokens, so it follows the theme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="224 238 576 546" aria-hidden className={cn('size-10 shrink-0', className)}>
      <g fill="var(--logo-bubble)">
        <rect x="224" y="238" width="576" height="432" rx="128" />
        <path d="M353 668v116l130-116z" />
      </g>
      <g
        fill="none"
        stroke="var(--logo-ink)"
        strokeWidth="37"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M342.5 426v54M406.5 387v133M471.5 414v82" />
        <path d="M551 458l60 60 106-135" />
      </g>
    </svg>
  )
}

type WordmarkProps = {
  className?: string
  /** The tagline under the name: always, from the sm breakpoint up, or never. */
  tagline?: boolean | 'sm'
}

/** Mark + name (+ tagline), as in the brand artwork. */
export function Wordmark({ className, tagline = false }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo />
      <span className="flex flex-col">
        <span className="text-[1.375rem] leading-none font-bold tracking-tight text-[var(--logo-title)]">
          {t('app.name')}
        </span>
        {tagline && (
          <span
            className={cn(
              'mt-1 text-xs leading-none font-medium text-[var(--logo-tagline)]',
              tagline === 'sm' && 'hidden sm:block',
            )}
          >
            {t('app.tagline')}
          </span>
        )}
      </span>
    </span>
  )
}
