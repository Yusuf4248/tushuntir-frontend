import { ArrowLeft, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Shows a back button. Goes back in history, or to this path when the page was opened directly. */
  backTo?: string
  /** 'close' shows an X instead of an arrow (full-screen flows). */
  backIcon?: 'back' | 'close'
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  backTo,
  backIcon = 'back',
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  useDocumentTitle(title)

  function goBack() {
    // 'default' = first entry of this tab's history, so there is nothing to go back to.
    if (location.key !== 'default') void navigate(-1)
    else if (backTo) void navigate(backTo, { replace: true })
  }

  const label = backIcon === 'close' ? t.placeholder.close : t.common.back
  const Icon = backIcon === 'close' ? X : ArrowLeft

  return (
    <header className={cn('mb-5 flex items-center gap-2', className)}>
      {backTo && (
        <Button variant="ghost" size="icon" onClick={goBack} aria-label={label} className="-ml-2">
          <Icon className="size-6" aria-hidden />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl leading-tight font-bold text-balance">{title}</h1>
        {subtitle && <p className="mt-0.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
