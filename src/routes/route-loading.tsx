import { Loader2 } from 'lucide-react'

import { Logo } from '@/components/logo'
import { t } from '@/lib/i18n'

/** Shown while the first screen's code loads (lazy routes). */
export function RouteLoading() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <div className="flex flex-col items-center gap-4">
        <Logo className="size-12" />
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    </div>
  )
}
