import { Fragment, type ReactNode } from 'react'

// "x^2", "a^-1", "x^{n+1}", "10^n" → superscripts. Display only: answers are sent as written.
const POWER = /\^(\{[^}]*\}|-?\d+|[a-zA-Z])/g

export function MathText({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(POWER)) {
    const index = match.index
    if (index > last) parts.push(text.slice(last, index))
    const exponent = (match[1] ?? '').replace(/^\{|\}$/g, '')
    parts.push(
      <sup key={index} className="text-[0.75em] leading-none">
        {exponent}
      </sup>,
    )
    last = index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  )
}
