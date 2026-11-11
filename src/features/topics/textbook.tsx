import { BookOpenText } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'

import { MathText } from '@/components/math-text'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import {
  pageDomId,
  paragraphDomId,
  parseBlocks,
  type Block,
  type Paragraph,
} from './textbook-utils'

function Blocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((block, i) => {
    if (block.kind === 'list') {
      return (
        <ul key={i} className="my-2 flex list-disc flex-col gap-1.5 pl-5 marker:text-primary">
          {block.items.map((item, j) => (
            <li key={j}>
              <MathText text={item} />
            </li>
          ))}
        </ul>
      )
    }
    if (block.kind === 'heading') {
      return (
        <p key={i} className="font-semibold">
          <MathText text={block.text} />
        </p>
      )
    }
    return (
      <p key={i} className="[&+p]:mt-2">
        <MathText text={block.text} />
      </p>
    )
  })
}

function ParagraphBody({ content }: { content: string }) {
  const blocks = parseBlocks(content)
  const [first, ...rest] = blocks
  // "### 1-misol" opens a worked example.
  if (first?.kind === 'heading') {
    return (
      <div className="rounded-r-xl border-l-4 border-primary bg-primary-soft/60 px-4 py-3">
        <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold tracking-wide text-primary-soft-foreground uppercase">
          <BookOpenText className="size-4" aria-hidden />
          <MathText text={first.text} />
        </p>
        <Blocks blocks={rest} />
      </div>
    )
  }
  return <Blocks blocks={blocks} />
}

type TextbookProps = {
  paragraphs: Paragraph[]
  highlightedId: string | null
  /** Extra controls under each paragraph (e.g. "AI dan so'rash"). */
  renderActions?: (paragraph: Paragraph) => ReactNode
}

/** The topic's textbook text in order, with a page marker wherever the page changes. */
export function Textbook({ paragraphs, highlightedId, renderActions }: TextbookProps) {
  const ordered = [...paragraphs].sort((a, b) => a.position - b.position)
  return (
    <div className="text-[1.0625rem] leading-relaxed">
      {ordered.map((p, i) => {
        const previousPage = i > 0 ? ordered[i - 1]?.page : undefined
        const showMarker = p.page !== null && p.page !== previousPage
        return (
          <Fragment key={p.id}>
            {showMarker && p.page !== null && (
              <div
                id={pageDomId(p.page)}
                className="my-4 flex scroll-mt-24 items-center gap-3 text-sm font-medium text-muted-foreground first:mt-0"
              >
                <span className="h-px flex-1 bg-border" aria-hidden />
                {t.topicPage.page(p.page)}
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>
            )}
            <section
              id={paragraphDomId(p.id)}
              data-paragraph-id={p.id}
              data-page={p.page ?? undefined}
              className={cn(
                'group/para relative -mx-2 my-1 scroll-mt-24 rounded-xl px-2 py-2 transition-colors duration-700',
                highlightedId === p.id && 'bg-warning-soft ring-2 ring-warning/40',
              )}
            >
              <ParagraphBody content={p.content} />
              {renderActions?.(p)}
            </section>
          </Fragment>
        )
      })}
    </div>
  )
}
