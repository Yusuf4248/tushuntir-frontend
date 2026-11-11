import { useEffect, useRef } from 'react'

import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

type QuestionDotsProps = {
  count: number
  current: number
  isAnswered: (index: number) => boolean
  onSelect: (index: number) => void
}

/** Numbered dots, filled when answered. Scrolls sideways when they do not fit. */
export function QuestionDots({ count, current, isAnswered, onSelect }: QuestionDotsProps) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = listRef.current?.children[current] as HTMLElement | undefined
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [current])

  return (
    <nav aria-label={t.quiz.questionNav}>
      <ol
        ref={listRef}
        className="-mx-1 flex snap-x [scrollbar-width:none] gap-0.5 overflow-x-auto px-1"
      >
        {Array.from({ length: count }, (_, i) => {
          const answered = isAnswered(i)
          const active = i === current
          return (
            <li key={i} className="snap-center">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${t.quiz.questionLabel(i + 1)}, ${answered ? t.quiz.answered : t.quiz.unanswered}`}
                className="grid size-11 cursor-pointer place-items-center"
              >
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors',
                    answered
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-dashed border-input text-muted-foreground',
                    active && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                  )}
                >
                  {i + 1}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
