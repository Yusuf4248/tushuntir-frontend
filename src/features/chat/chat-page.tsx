import { useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'

import { useTopic } from '@/api/me'
import { t } from '@/lib/strings.uz'
import { useDocumentTitle } from '@/lib/use-document-title'
import { paths } from '@/routes/paths'

import type { AskRequest } from './ask-actions'
import { ChatPanel, type PendingAsk } from './chat-panel'

/**
 * /chat/:topicId — the chat on its own page (review's "Batafsil tushuntir", self-study).
 * ?q= pre-fills a suggested question; location.state.ask sends a textbook request once.
 */
export function ChatPage() {
  const topicId = Number(useParams().topicId)
  const topic = useTopic(topicId)
  useDocumentTitle(topic.data ? `${t.chat.title}: ${topic.data.title}` : t.chat.title)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [ask, setAsk] = useState<PendingAsk | null>(() => {
    const request = (location.state as { ask?: AskRequest } | null)?.ask
    return request ? { request, nonce: Date.now() } : null
  })

  function close() {
    if (location.key !== 'default') void navigate(-1)
    else void navigate(paths.topic(topicId), { replace: true })
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col md:py-6">
      <ChatPanel
        className="flex-1 md:rounded-2xl md:border md:shadow-card"
        topicId={topicId}
        topicTitle={topic.data?.title}
        ask={ask}
        onAskHandled={() => {
          setAsk(null)
          // Do not send it again after a reload.
          void navigate(location.pathname + location.search, { replace: true, state: null })
        }}
        initialDraft={searchParams.get('q') ?? ''}
        onClose={close}
      />
    </div>
  )
}
