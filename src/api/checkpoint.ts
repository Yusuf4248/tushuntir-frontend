import { apiFileUrl } from '@/lib/api-url'

import { apiRequest } from './client'
import type { Checkpoint, CheckpointAnswerResult, CheckpointStatus } from './types'

export const checkpointKeys = {
  status: (topicId: number) => ['checkpoint', topicId, 'status'] as const,
}

export function fetchCheckpointStatus(
  topicId: number,
  signal?: AbortSignal,
): Promise<CheckpointStatus> {
  return apiRequest<CheckpointStatus>(`/me/topics/${topicId}/checkpoint/status`, { signal })
}

/** Starts a try, or returns the open one (with its follow-up line when one is pending). */
export function startCheckpoint(topicId: number): Promise<Checkpoint> {
  return apiRequest<Checkpoint>(`/me/topics/${topicId}/checkpoint/start`, { method: 'POST' })
}

export type CheckpointAnswer =
  { kind: 'voice'; audio: Blob; fileName: string } | { kind: 'text'; text: string }

export function answerCheckpoint(
  checkpointId: number,
  answer: CheckpointAnswer,
): Promise<CheckpointAnswerResult> {
  const path = `/me/checkpoints/${checkpointId}/answer`
  if (answer.kind === 'text') {
    return apiRequest<CheckpointAnswerResult>(path, { method: 'POST', body: { text: answer.text } })
  }
  const form = new FormData()
  form.append('audio', answer.audio, answer.fileName)
  return apiRequest<CheckpointAnswerResult>(path, { method: 'POST', body: form })
}

/** audioUrl values are relative to the API's origin (e.g. /uploads/tts/….mp3). */
export const absoluteAudioUrl = apiFileUrl
