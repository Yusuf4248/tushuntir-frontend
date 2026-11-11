import { Dialog } from 'radix-ui'
import { useRef, type ReactNode } from 'react'

import { t } from '@/lib/strings.uz'

const CLOSE_DISTANCE = 120

type ChatSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Runs once the sheet has closed. Return true when it moved the page itself (e.g. scrolled to
   * a source), so focus does not jump back to the button that opened the sheet.
   */
  onClosed?: () => boolean
  /** The panel; the sheet puts its drag handle above it. */
  children: ReactNode
}

/** Phone chat: a bottom sheet at ~85% height; drag the handle down to close. */
export function ChatSheet({ open, onOpenChange, onClosed, children }: ChatSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; dy: number; id: number } | null>(null)

  const setOffset = (dy: number, animate: boolean) => {
    const el = contentRef.current
    if (!el) return
    el.style.transition = animate ? 'transform 180ms ease-out' : 'none'
    el.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  }

  const dragProps: React.HTMLAttributes<HTMLDivElement> = {
    style: { touchAction: 'none' },
    onPointerDown: (e) => {
      drag.current = { startY: e.clientY, dy: 0, id: e.pointerId }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      d.dy = Math.max(0, e.clientY - d.startY)
      setOffset(d.dy, false)
    },
    onPointerUp: (e) => {
      const d = drag.current
      drag.current = null
      if (!d || d.id !== e.pointerId) return
      if (d.dy > CLOSE_DISTANCE) onOpenChange(false)
      else setOffset(0, true)
    },
    onPointerCancel: () => {
      drag.current = null
      setOffset(0, true)
    },
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          ref={contentRef}
          aria-describedby={undefined}
          // Focus the sheet itself: focusing the input would open the keyboard over the answer.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            contentRef.current?.focus()
          }}
          tabIndex={-1}
          onCloseAutoFocus={(e) => {
            if (onClosed?.()) e.preventDefault()
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t bg-card shadow-xl outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in"
        >
          <Dialog.Title className="sr-only">{t.chat.title}</Dialog.Title>
          <p className="sr-only">{t.chat.dragHint}</p>
          <div
            {...dragProps}
            className="flex shrink-0 cursor-grab justify-center pt-2.5 pb-2"
            aria-hidden
          >
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
