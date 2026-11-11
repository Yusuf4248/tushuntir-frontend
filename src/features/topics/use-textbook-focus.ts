import { useCallback, useEffect, useRef, useState } from 'react'

import { paragraphDomId, type Paragraph } from './textbook-utils'

const HIGHLIGHT_MS = 2500

export type FocusTarget = {
  paragraphId?: string | null
  page?: number | null
  chunkId?: number | null
}

/** The paragraph a target points at: the exact id, else the chunk on that page, else the page. */
export function findParagraph(paragraphs: Paragraph[], target: FocusTarget): Paragraph | undefined {
  const ordered = [...paragraphs].sort((a, b) => a.position - b.position)
  if (target.paragraphId) {
    const exact = ordered.find((p) => p.id === target.paragraphId)
    if (exact) return exact
  }
  if (target.chunkId != null) {
    const inChunk = ordered.filter((p) => p.chunkId === target.chunkId)
    const onPage = inChunk.find((p) => target.page == null || p.page === target.page)
    if (onPage ?? inChunk[0]) return onPage ?? inChunk[0]
  }
  if (target.page != null) return ordered.find((p) => p.page === target.page)
  return undefined
}

/** Scrolls the textbook to a paragraph and highlights it briefly. */
export function useTextbookFocus(paragraphs: Paragraph[] | undefined) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const focus = useCallback(
    (target: FocusTarget): boolean => {
      const paragraph = paragraphs && findParagraph(paragraphs, target)
      if (!paragraph) return false
      // Wait a frame so the text is laid out (and a closing sheet is gone).
      window.requestAnimationFrame(() => {
        const el = document.getElementById(paragraphDomId(paragraph.id))
        if (!el) return
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
        setHighlightedId(paragraph.id)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS)
      })
      return true
    },
    [paragraphs],
  )

  return { highlightedId, focus }
}
