/**
 * Per-tab copy of an open attempt (sessionStorage). Fallback only, for backends without
 * GET /me/attempts/:id or without hint texts on resumed questions. Every access is wrapped:
 * storage can throw or be empty, and the quiz must work without it.
 */
import type { AttemptView } from '@/api/types'

export type AttemptKind = 'quiz' | 'practice'

export type AttemptSnapshot = {
  view: AttemptView
  kind: AttemptKind
  topicId: number | null
  /** questionId → answer as last typed or chosen */
  answers: Record<number, string>
  /** questionId → { level → hint text } already shown */
  hints: Record<number, Record<number, string>>
  /** questionId → the misconception the last hint returned */
  misconceptions: Record<number, string>
}

const attemptKey = (attemptId: number) => `tushuntir.attempt.${attemptId}`
const practiceKey = (topicId: number) => `tushuntir.practice.${topicId}`

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the fallback is simply unavailable.
  }
}

function remove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nothing to do.
  }
}

export const attemptStorage = {
  load: (attemptId: number) => read<AttemptSnapshot>(attemptKey(attemptId)),
  save: (snapshot: AttemptSnapshot) => {
    write(attemptKey(snapshot.view.attemptId), snapshot)
    if (snapshot.kind === 'practice' && snapshot.topicId !== null) {
      write(practiceKey(snapshot.topicId), snapshot.view.attemptId)
    }
  },
  /** Called after submit: the open copy is no longer needed. */
  clear: (attemptId: number) => {
    const snapshot = read<AttemptSnapshot>(attemptKey(attemptId))
    if (snapshot?.kind === 'practice' && snapshot.topicId !== null) {
      if (read<number>(practiceKey(snapshot.topicId)) === attemptId) {
        remove(practiceKey(snapshot.topicId))
      }
    }
    remove(attemptKey(attemptId))
  },
  /** The open practice attempt of a topic started in this tab, if any. */
  openPractice: (topicId: number): number | null => {
    const id = read<number>(practiceKey(topicId))
    return id !== null && read<AttemptSnapshot>(attemptKey(id)) ? id : null
  },
}

export function snapshotFromView(
  view: AttemptView,
  kind: AttemptKind,
  topicId: number | null,
): AttemptSnapshot {
  const answers: Record<number, string> = {}
  const hints: Record<number, Record<number, string>> = {}
  for (const q of view.questions) {
    if (q.answer !== null) answers[q.questionId] = q.answer
    if (q.hints?.length) {
      hints[q.questionId] = Object.fromEntries(q.hints.map((text, i) => [i + 1, text]))
    }
  }
  return { view, kind, topicId, answers, hints, misconceptions: {} }
}
