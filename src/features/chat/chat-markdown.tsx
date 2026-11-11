import type { ReactNode } from 'react'

import { MathText } from '@/components/math-text'

/** **bold** inside a line; everything else is plain text (never HTML). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        <MathText text={part.slice(2, -2)} />
      </strong>
    ) : (
      <MathText key={i} text={part} />
    ),
  )
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] }

function parse(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    const last = blocks.at(-1)
    if (bullet?.[1] !== undefined) {
      if (last?.kind === 'ul') last.items.push(bullet[1])
      else blocks.push({ kind: 'ul', items: [bullet[1]] })
    } else if (numbered?.[1] !== undefined) {
      if (last?.kind === 'ol') last.items.push(numbered[1])
      else blocks.push({ kind: 'ol', items: [numbered[1]] })
    } else if (!line.trim()) {
      blocks.push({ kind: 'p', lines: [] }) // paragraph break
    } else if (last?.kind === 'p' && last.lines.length > 0) {
      last.lines.push(line)
    } else {
      blocks.push({ kind: 'p', lines: [line] })
    }
  }
  return blocks.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : b.items.length > 0))
}

/** Simple, safe markdown for chat answers: paragraphs, **bold**, bullet and numbered lists, x². */
export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 leading-relaxed">
      {parse(text).map((block, i): ReactNode => {
        if (block.kind === 'p') {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  <Inline text={line} />
                </span>
              ))}
            </p>
          )
        }
        const List = block.kind === 'ul' ? 'ul' : 'ol'
        return (
          <List
            key={i}
            className={
              block.kind === 'ul'
                ? 'flex list-disc flex-col gap-1 pl-5'
                : 'flex list-decimal flex-col gap-1 pl-5'
            }
          >
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
