import { useCallback, useEffect, useRef, useState } from 'react'

import { saveAnswer } from '@/api/attempts'

export type SaveStatus = 'saving' | 'saved' | 'error'

/**
 * Saves answers one question at a time. Per question, requests never overlap and the last
 * value always wins; short answers can be debounced. `flushAll` waits for everything.
 */
export function useAnswerSaver(
  attemptId: number,
  /** Answers the server already has. */
  onServer: Record<number, string>,
  /** Answers on screen; any that differ from onServer are sent by the next flush. */
  onScreen: Record<number, string>,
  onError: (error: unknown) => void,
) {
  const [status, setStatus] = useState<Record<number, SaveStatus>>({})
  const [initial] = useState(() => ({
    saved: toEntries(onServer),
    latest: toEntries({ ...onServer, ...onScreen }).filter(([, v]) => v.trim() !== ''),
  }))
  const latest = useRef(new Map(initial.latest))
  const saved = useRef(new Map(initial.saved))
  const running = useRef(new Map<number, Promise<boolean>>())
  const timers = useRef(new Map<number, number>())
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const run = useCallback(
    (questionId: number): Promise<boolean> => {
      const current = running.current.get(questionId)
      if (current) return current
      const job = (async () => {
        try {
          while (latest.current.get(questionId) !== saved.current.get(questionId)) {
            const value = latest.current.get(questionId) ?? ''
            setStatus((s) => ({ ...s, [questionId]: 'saving' }))
            await saveAnswer(attemptId, questionId, value)
            saved.current.set(questionId, value)
          }
          setStatus((s) => ({ ...s, [questionId]: 'saved' }))
          return true
        } catch (error) {
          setStatus((s) => ({ ...s, [questionId]: 'error' }))
          onErrorRef.current(error)
          return false
        } finally {
          running.current.delete(questionId)
        }
      })()
      running.current.set(questionId, job)
      return job
    },
    [attemptId],
  )

  /** Records the answer and saves it now, or after `delayMs` of no further changes. */
  const save = useCallback(
    (questionId: number, value: string, delayMs = 0) => {
      // An empty text is not sent (the API rejects it); the last saved answer stays.
      if (!value.trim()) return
      latest.current.set(questionId, value)
      const timer = timers.current.get(questionId)
      if (timer) window.clearTimeout(timer)
      timers.current.delete(questionId)
      if (delayMs > 0) {
        timers.current.set(
          questionId,
          window.setTimeout(() => {
            timers.current.delete(questionId)
            void run(questionId)
          }, delayMs),
        )
      } else {
        void run(questionId)
      }
    },
    [run],
  )

  /** Sends a debounced answer now and waits for its save. */
  const flush = useCallback(
    (questionId: number): Promise<boolean> => {
      const timer = timers.current.get(questionId)
      if (timer) window.clearTimeout(timer)
      timers.current.delete(questionId)
      return run(questionId)
    },
    [run],
  )

  /** Sends everything not yet saved; resolves true when all answers are on the server. */
  const flushAll = useCallback(async (): Promise<boolean> => {
    const ids = new Set([...latest.current.keys(), ...running.current.keys()])
    const results = await Promise.all([...ids].map((id) => flush(id)))
    return results.every(Boolean)
  }, [flush])

  return { status, save, flush, flushAll }
}

function toEntries(record: Record<number, string>): [number, string][] {
  return Object.entries(record).map(([k, v]) => [Number(k), v])
}
