import { AlertDialog } from 'radix-ui'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-5 text-card-foreground shadow-xl outline-none data-[state=open]:animate-pop-in">
          <AlertDialog.Title className="text-lg leading-snug font-semibold">
            {title}
          </AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mt-2 text-muted-foreground">
              {description}
            </AlertDialog.Description>
          ) : (
            <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className={cn(buttonVariants({ variant: 'outline' }))}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action className={cn(buttonVariants())} onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
