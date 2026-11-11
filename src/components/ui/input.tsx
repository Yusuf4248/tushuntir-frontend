import * as React from 'react'

import { cn } from '@/lib/utils'

/** 16px text keeps iOS Safari from zooming in on focus. */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-xl border border-input bg-card px-4 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40 disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label data-slot="label" className={cn('text-sm font-medium', className)} {...props} />
}

export { Input, Label }
