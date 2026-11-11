import { HelpCircle, Languages, Lightbulb, Sparkles, type LucideIcon } from 'lucide-react'

import type { ChatAction } from '@/api/types'
import { t } from '@/lib/strings.uz'

/** The backend limit for selectedText. */
export const MAX_SELECTED_TEXT = 2000

export type AskRequest = { selectedText: string; action: ChatAction }

export const askActions: { action: ChatAction; label: string; icon: LucideIcon }[] = [
  { action: 'explain_simple', label: t.ask.explain_simple, icon: Sparkles },
  { action: 'real_life_example', label: t.ask.real_life_example, icon: Lightbulb },
  { action: 'in_russian', label: t.ask.in_russian, icon: Languages },
  { action: 'quiz_me', label: t.ask.quiz_me, icon: HelpCircle },
]

export function clampSelection(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > MAX_SELECTED_TEXT ? `${clean.slice(0, MAX_SELECTED_TEXT - 1)}…` : clean
}
