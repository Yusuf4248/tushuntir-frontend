import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import {
  chatKeys,
  createChatSession,
  fetchChatSession,
  fetchLatestChatSession,
  sendChatMessage,
} from '@/api/chat'
import { ApiError, errorMessage } from '@/api/errors'
import type { ChatAction, ChatMessageBody, ChatSession, ChatSource, ChatTurn } from '@/api/types'

export type ChatItem = {
  key: string
  role: 'student' | 'assistant'
  /** Student: the typed text (or the action label); assistant: the answer. */
  text: string
  quote: string | null
  action: ChatAction | null
  sources: ChatSource[]
  /** False when the textbook does not cover it, it is off topic, or it was refused. */
  grounded: boolean
  notice: 'not_covered' | 'off_topic' | 'refused' | null
  /** Student messages only. */
  status: 'sent' | 'sending' | 'error'
  error: string | null
  request: ChatMessageBody | null
}

export type ChatThread = { sessionId: number | null; items: ChatItem[] }

const ACTIONS: ChatAction[] = ['explain_simple', 'real_life_example', 'in_russian', 'quiz_me']

// --- per-tab fallback: the session id of each topic ---------------------------------------

const storageKey = (topicId: number) => `tushuntir.chat.${topicId}`

function storedSessionId(topicId: number): number | null {
  try {
    const raw = sessionStorage.getItem(storageKey(topicId))
    return raw ? Number(raw) || null : null
  } catch {
    return null
  }
}

function storeSessionId(topicId: number, sessionId: number): void {
  try {
    sessionStorage.setItem(storageKey(topicId), String(sessionId))
  } catch {
    // The conversation simply will not survive a reload.
  }
}

// --- mapping API turns to items -------------------------------------------------------------

/** The API stores a student turn as "> quote\n\ntext", and an action-only turn as "(action)". */
export function parseStudentContent(content: string): {
  quote: string | null
  text: string
  action: ChatAction | null
} {
  let quote: string | null = null
  let rest = content
  if (content.startsWith('> ')) {
    const split = content.indexOf('\n\n')
    quote = (split === -1 ? content : content.slice(0, split)).replace(/^> ?/gm, '').trim()
    rest = split === -1 ? '' : content.slice(split + 2)
  }
  const match = /^\((\w+)\)$/.exec(rest.trim())
  const action = match && ACTIONS.includes(match[1] as ChatAction) ? (match[1] as ChatAction) : null
  return { quote, text: action ? '' : rest.trim(), action }
}

function noticeOf(turn: Pick<ChatTurn, 'covered' | 'onTopic' | 'refused'>): ChatItem['notice'] {
  if (turn.refused) return 'refused'
  if (turn.onTopic === false) return 'off_topic'
  if (turn.covered === false) return 'not_covered'
  return null
}

export function itemFromTurn(turn: ChatTurn): ChatItem {
  const base = {
    key: `turn-${turn.id}`,
    role: turn.role,
    status: 'sent' as const,
    error: null,
    request: null,
  }
  if (turn.role === 'student') {
    const { quote, text, action } = parseStudentContent(turn.content)
    return { ...base, text, quote, action, sources: [], grounded: true, notice: null }
  }
  const notice = noticeOf(turn)
  return {
    ...base,
    text: turn.content,
    quote: null,
    action: null,
    sources: turn.sources ?? [],
    grounded: notice === null,
    notice,
  }
}

function threadFromSession(session: ChatSession): ChatThread {
  return { sessionId: session.sessionId, items: session.messages.map(itemFromTurn) }
}

/**
 * Restores the topic's conversation: the latest session from the API, else the session this tab
 * started, else an empty thread (a session is created with the first message).
 */
async function loadThread(topicId: number, signal: AbortSignal): Promise<ChatThread> {
  const latest = await fetchLatestChatSession(topicId, signal)
  if (latest) return threadFromSession(latest)
  const stored = storedSessionId(topicId)
  if (stored) {
    try {
      return threadFromSession(await fetchChatSession(stored, signal))
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
  }
  return { sessionId: null, items: [] }
}

export function useChatThread(topicId: number) {
  return useQuery({
    queryKey: chatKeys.thread(topicId),
    queryFn: ({ signal }) => loadThread(topicId, signal),
    // The thread is local state once loaded; never refetch underneath the conversation.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

let localKey = 0
const nextKey = () => `local-${++localKey}`

export function useSendChat(topicId: number) {
  const queryClient = useQueryClient()
  const key = useMemo(() => chatKeys.thread(topicId), [topicId])

  const update = useCallback(
    (fn: (thread: ChatThread) => ChatThread) =>
      queryClient.setQueryData<ChatThread>(key, (thread) =>
        fn(thread ?? { sessionId: null, items: [] }),
      ),
    [queryClient, key],
  )

  const mutation = useMutation({
    mutationFn: async ({ body, itemKey }: { body: ChatMessageBody; itemKey: string }) => {
      let sessionId = queryClient.getQueryData<ChatThread>(key)?.sessionId ?? null
      if (sessionId === null) {
        sessionId = (await createChatSession(topicId)).sessionId
        storeSessionId(topicId, sessionId)
        update((t) => ({ ...t, sessionId }))
      }
      try {
        return { itemKey, exchange: await sendChatMessage(sessionId, body) }
      } catch (error) {
        // The session may be gone (e.g. the demo was reset): start a new one once.
        if (!(error instanceof ApiError && error.status === 404)) throw error
        const fresh = (await createChatSession(topicId)).sessionId
        storeSessionId(topicId, fresh)
        update((t) => ({ ...t, sessionId: fresh }))
        return { itemKey, exchange: await sendChatMessage(fresh, body) }
      }
    },
    onSuccess: ({ itemKey, exchange }) => {
      update((t) => ({
        sessionId: exchange.sessionId,
        items: t.items.flatMap((item) =>
          item.key === itemKey
            ? [
                // Keep what the student saw (their quote and action), with the server's id.
                { ...item, key: `turn-${exchange.message.id}`, status: 'sent' as const },
                itemFromTurn(exchange.reply),
              ]
            : [item],
        ),
      }))
    },
    onError: (error, { itemKey }) => {
      update((t) => ({
        ...t,
        items: t.items.map((item) =>
          item.key === itemKey
            ? { ...item, status: 'error' as const, error: errorMessage(error) }
            : item,
        ),
      }))
    },
  })

  const send = useCallback(
    (body: ChatMessageBody) => {
      const itemKey = nextKey()
      update((t) => ({
        ...t,
        items: [
          ...t.items,
          {
            key: itemKey,
            role: 'student',
            text: body.text?.trim() ?? '',
            quote: body.selectedText ?? null,
            action: body.action ?? null,
            sources: [],
            grounded: true,
            notice: null,
            status: 'sending',
            error: null,
            request: body,
          },
        ],
      }))
      mutation.mutate({ body, itemKey })
    },
    [mutation, update],
  )

  /** Removes a failed message and sends it again. */
  const retry = useCallback(
    (item: ChatItem) => {
      if (!item.request) return
      update((t) => ({ ...t, items: t.items.filter((i) => i.key !== item.key) }))
      send(item.request)
    },
    [send, update],
  )

  return { send, retry }
}

/** True while an answer is on its way (also after the panel was closed and reopened). */
export function isWaiting(thread: ChatThread | undefined): boolean {
  return thread?.items.some((item) => item.status === 'sending') ?? false
}
