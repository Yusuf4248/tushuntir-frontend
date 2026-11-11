import type { ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

type SectionProps = {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, action, children, className }: SectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cn('mt-7', className)}>
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
