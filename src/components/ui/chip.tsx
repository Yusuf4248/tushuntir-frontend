import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const chipVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm leading-none font-medium whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground',
        primary: 'bg-primary-soft text-primary-soft-foreground',
        info: 'bg-info-soft text-info',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        success: 'bg-success-soft text-success',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type ChipTone = NonNullable<VariantProps<typeof chipVariants>['tone']>

type ChipProps = React.ComponentProps<'span'> & {
  tone?: ChipTone
  icon?: LucideIcon
}

/** A small label. Always pass an icon or meaningful text: color is never the only signal. */
function Chip({ className, tone, icon: Icon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ tone }), className)} {...props}>
      {Icon && <Icon aria-hidden />}
      {children}
    </span>
  )
}

export { Chip }
export type { ChipTone }
