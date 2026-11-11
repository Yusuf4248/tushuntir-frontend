import type { TopicDetail } from '@/api/types'

export type Paragraph = TopicDetail['paragraphs'][number]

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }

/** Textbook chunks are plain text with "### Heading" lines and "- item" lists. */
export function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'heading', text: line.slice(4) })
    } else if (line.startsWith('- ')) {
      const last = blocks.at(-1)
      if (last?.kind === 'list') last.items.push(line.slice(2))
      else blocks.push({ kind: 'list', items: [line.slice(2)] })
    } else {
      blocks.push({ kind: 'text', text: line })
    }
  }
  return blocks
}

export const paragraphDomId = (id: string) => `para-${id}`
export const pageDomId = (page: number) => `page-${page}`
