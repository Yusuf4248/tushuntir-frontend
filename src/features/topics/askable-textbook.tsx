import { Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ChatAction } from '@/api/types'
import { clampSelection, type AskRequest } from '@/features/chat/ask-actions'
import { AskMenu, type AnchorRect } from '@/features/chat/ask-menu'
import { prefersMenuBelow, useTextSelection } from '@/features/chat/use-text-selection'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { Textbook } from './textbook'
import type { Paragraph } from './textbook-utils'

type AskableTextbookProps = {
  paragraphs: Paragraph[]
  highlightedId: string | null
  onAsk: (request: AskRequest) => void
}

/** The textbook plus "ask the AI": a menu on text selection and a button under each paragraph. */
export function AskableTextbook({ paragraphs, highlightedId, onAsk }: AskableTextbookProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { selection, clear } = useTextSelection(containerRef)
  const [paragraphMenu, setParagraphMenu] = useState<{ text: string; rect: AnchorRect } | null>(
    null,
  )

  // Close the paragraph menu on Escape, scroll or a tap elsewhere.
  useEffect(() => {
    if (!paragraphMenu) return
    const close = () => setParagraphMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[role=toolbar]')) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [paragraphMenu])

  function ask(text: string, action: ChatAction) {
    clear()
    setParagraphMenu(null)
    onAsk({ selectedText: clampSelection(text), action })
  }

  return (
    <div ref={containerRef}>
      <Textbook
        paragraphs={paragraphs}
        highlightedId={highlightedId}
        renderActions={(p) => (
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={paragraphMenu?.text === p.content}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setParagraphMenu({
                text: p.content,
                rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
              })
            }}
            className={cn(
              // Touch: an inline button under the paragraph.
              '-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-primary select-none',
              // Mouse: a pill at the top-right that appears on hover or focus and takes no space.
              '[@media(hover:hover)]:absolute [@media(hover:hover)]:-top-4 [@media(hover:hover)]:right-0 [@media(hover:hover)]:ml-0 [@media(hover:hover)]:min-h-9 [@media(hover:hover)]:rounded-full [@media(hover:hover)]:border [@media(hover:hover)]:bg-card [@media(hover:hover)]:px-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:shadow-card [@media(hover:hover)]:transition-opacity',
              'group-hover/para:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100',
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            {t.ask.paragraphButton}
          </button>
        )}
      />

      {selection && !paragraphMenu && (
        <AskMenu
          anchor={selection.rect}
          placement={prefersMenuBelow() ? 'below' : 'above'}
          onChoose={(action) => ask(selection.text, action)}
        />
      )}
      {paragraphMenu && (
        <AskMenu
          anchor={paragraphMenu.rect}
          placement="below"
          onChoose={(action) => ask(paragraphMenu.text, action)}
        />
      )}
    </div>
  )
}
