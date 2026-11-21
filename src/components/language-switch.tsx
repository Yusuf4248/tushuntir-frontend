import { useTranslation } from 'react-i18next'

import { LANGUAGES, currentLanguage, setLanguage, t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type LanguageSwitchProps = {
  /** compact: "UZ RU EN" (login header); full: each language's own name (Profile). */
  variant?: 'compact' | 'full'
  className?: string
}

/** Interface language: uz / ru / en, remembered on this device. */
export function LanguageSwitch({ variant = 'full', className }: LanguageSwitchProps) {
  // Re-render when the language changes.
  useTranslation()
  const current = currentLanguage()
  const compact = variant === 'compact'
  return (
    <div
      role="radiogroup"
      aria-label={t('language.label')}
      className={cn(
        'grid grid-cols-3 gap-1 rounded-xl bg-muted p-1',
        compact && 'border bg-card/90',
        className,
      )}
    >
      {LANGUAGES.map(({ code, name }) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={current === code}
          aria-label={compact ? name : undefined}
          lang={code}
          onClick={() => setLanguage(code)}
          className={cn(
            'flex min-h-11 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors',
            compact ? 'min-w-11 px-2 font-semibold uppercase' : 'px-2',
            current === code
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground',
            current === code && compact && 'bg-primary-soft text-primary-soft-foreground',
          )}
        >
          {compact ? code : name}
        </button>
      ))}
    </div>
  )
}
