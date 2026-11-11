import { useEffect, useState, type RefObject } from 'react'

import type { AnchorRect } from './ask-menu'

export type TextSelection = { text: string; rect: AnchorRect }

const MIN_LENGTH = 3

function readSelection(container: HTMLElement): TextSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const { anchorNode, focusNode } = selection
  if (!anchorNode || !focusNode) return null
  if (!container.contains(anchorNode) || !container.contains(focusNode)) return null
  const text = selection.toString().trim()
  if (text.length < MIN_LENGTH) return null
  const r = selection.getRangeAt(0).getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { text, rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
}

/**
 * The current text selection inside `container` (mouse or touch), with its viewport rectangle.
 * Kept up to date while the page scrolls.
 */
export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const update = () => {
      window.clearTimeout(timer)
      // Touch handles fire many events; settle first.
      timer = window.setTimeout(() => {
        const container = containerRef.current
        setSelection(container ? readSelection(container) : null)
      }, 120)
    }
    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [containerRef])

  const clear = () => {
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }

  return { selection, clear }
}

/** Touch screens show their own selection menu above the text. */
export function prefersMenuBelow(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}
