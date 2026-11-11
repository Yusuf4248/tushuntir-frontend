import { apiRequest } from './client'
import { ApiError } from './errors'
import type { ChatExchange, ChatMessageBody, ChatSession } from './types'

export const chatKeys = {
  thread: (topicId: number) => ['chat', topicId] as const,
}

/** Every call creates a new session; create one only when the first message is sent. */
export function createChatSession(topicId: number): Promise<ChatSession> {
  return apiRequest<ChatSession>('/me/chat/sessions', { method: 'POST', body: { topicId } })
}

/** The student's latest session for a topic, or null when there is none (404). */
export async function fetchLatestChatSession(
  topicId: number,
  signal?: AbortSignal,
): Promise<ChatSession | null> {
  try {
    return await apiRequest<ChatSession>(`/me/chat/sessions?topicId=${topicId}`, { signal })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) return null
    throw error
  }
}

export function fetchChatSession(sessionId: number, signal?: AbortSignal): Promise<ChatSession> {
  return apiRequest<ChatSession>(`/me/chat/sessions/${sessionId}`, { signal })
}

export function sendChatMessage(sessionId: number, body: ChatMessageBody): Promise<ChatExchange> {
  return apiRequest<ChatExchange>(`/me/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body,
  })
}
