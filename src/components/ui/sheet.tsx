import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'

import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Bottom sheet on phones, a centered panel from sm up. Focus is trapped while open. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t bg-card text-card-foreground shadow-xl outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in',
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:data-[state=open]:animate-pop-in',
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
          <div className="flex items-start gap-3 px-5 pt-3 pb-2">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-muted"
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div className="border-t px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
