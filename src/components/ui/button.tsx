import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-150 select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // The sticker: ink outline and a solid offset shadow that presses flat on tap.
        primary:
          'sticker bg-primary text-primary-foreground hover:bg-primary-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        secondary: 'bg-primary-soft text-primary-soft-foreground hover:brightness-95',
        outline: 'border-2 border-input bg-card text-foreground hover:border-ink/40 hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-danger-soft text-danger hover:brightness-95',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // Every size keeps a tap target of at least 44px.
        default: 'h-12 px-5 text-base',
        sm: 'h-11 px-4 text-sm',
        lg: 'h-14 px-6 text-lg',
        icon: 'size-11',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
