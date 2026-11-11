import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { ChatAction } from '@/api/types'
import { t } from '@/lib/strings.uz'

import { askActions } from './ask-actions'

export type AnchorRect = { top: number; bottom: number; left: number; right: number }

type AskMenuProps = {
  /** Viewport rectangle the menu points at (a selection or a button). */
  anchor: AnchorRect
  /** 'below' on touch screens, where the system's own selection menu sits above. */
  placement: 'above' | 'below'
  onChoose: (action: ChatAction) => void
}

const GAP = 10
const EDGE = 8

/** Floating row of the four "ask the AI" actions, kept inside the viewport. */
export function AskMenu({ anchor, placement, onChoose }: AskMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const centre = (anchor.left + anchor.right) / 2
    const left = Math.min(Math.max(centre - width / 2, EDGE), vw - width - EDGE)
    let top = placement === 'above' ? anchor.top - height - GAP : anchor.bottom + GAP
    // Flip when there is no room on the preferred side.
    if (top < EDGE) top = anchor.bottom + GAP
    if (top + height > vh - EDGE) top = Math.max(anchor.top - height - GAP, EDGE)
    setPos({ top, left })
  }, [anchor, placement])

  return createPortal(
    <div
      ref={ref}
      role="toolbar"
      aria-label={t.ask.menuLabel}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="fixed z-40 flex max-w-[calc(100vw-1rem)] flex-wrap gap-1 rounded-2xl border bg-card p-1 text-card-foreground shadow-xl data-[shown]:animate-pop-in"
      data-shown={pos ? '' : undefined}
      // Keep the text selection while a button is pressed (mouse).
      onPointerDown={(e) => e.preventDefault()}
    >
      {askActions.map(({ action, label, icon: Icon }) => (
        <button
          key={action}
          type="button"
          onClick={() => onChoose(action)}
          className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap hover:bg-muted focus-visible:bg-muted"
        >
          <Icon className="size-4 text-primary" aria-hidden />
          {label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
