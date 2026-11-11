import { BookOpen, Info, RotateCcw, SendHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import type { ChatAction, ChatSource } from '@/api/types'
import { MathText } from '@/components/math-text'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import type { AskRequest } from './ask-actions'
import { ChatMarkdown } from './chat-markdown'
import { isWaiting, useChatThread, useSendChat, type ChatItem } from './chat-thread'

const MAX_TEXT = 1000

const quickActions: { action: ChatAction; label: string }[] = [
  { action: 'explain_simple', label: t.chat.quick_explain_simple },
  { action: 'real_life_example', label: t.chat.quick_real_life_example },
  { action: 'in_russian', label: t.chat.quick_in_russian },
  { action: 'quiz_me', label: t.chat.quick_quiz_me },
]

const actionLabel = (action: ChatAction) =>
  quickActions.find((q) => q.action === action)?.label ?? action

export type PendingAsk = { request: AskRequest; nonce: number }

type ChatPanelProps = {
  topicId: number
  topicTitle?: string
  /** A request from the textbook selection, sent once per nonce. */
  ask?: PendingAsk | null
  /** Called once the ask was sent, so the owner can drop it. */
  onAskHandled?: () => void
  /** Text put in the input without sending (e.g. a suggested question). */
  initialDraft?: string
  /** On the topic page: scroll the textbook. Elsewhere chips link to the topic page. */
  onSourceClick?: (source: ChatSource) => void
  onClose?: () => void
  className?: string
}

export function ChatPanel({
  topicId,
  topicTitle,
  ask,
  onAskHandled,
  initialDraft = '',
  onSourceClick,
  onClose,
  className,
}: ChatPanelProps) {
  const thread = useChatThread(topicId)
  const { send, retry } = useSendChat(topicId)
  const waiting = isWaiting(thread.data)
  const [draft, setDraft] = useState(initialDraft)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Send a selection request once, as soon as the conversation is loaded.
  const sentNonce = useRef<number | null>(null)
  const loaded = thread.isSuccess
  useEffect(() => {
    if (!ask || !loaded || sentNonce.current === ask.nonce) return
    sentNonce.current = ask.nonce
    send({ selectedText: ask.request.selectedText, action: ask.request.action })
    onAskHandled?.()
  }, [ask, loaded, send, onAskHandled])

  // Keep the newest message in view.
  const count = thread.data?.items.length ?? 0
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [count, waiting])

  // Grow the input with its text, up to about five lines.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [draft])

  function submit(action?: ChatAction) {
    const text = draft.trim()
    if (waiting || (!text && !action)) return
    send({ text: text || undefined, action })
    setDraft('')
  }

  return (
    <section
      aria-label={t.chat.title}
      className={cn('flex min-h-0 flex-col bg-card text-card-foreground', className)}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t.chat.title}</h2>
          {topicTitle && <p className="truncate text-sm text-muted-foreground">{topicTitle}</p>}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t.chat.close}>
            <X className="size-5" aria-hidden />
          </Button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
        aria-busy={waiting}
      >
        {thread.isPending ? (
          <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-16 w-4/5" />
            <Skeleton className="ml-auto h-10 w-3/5" />
          </div>
        ) : thread.isError ? (
          <ErrorState
            title={t.chat.loadFailed}
            message={errorMessage(thread.error)}
            onRetry={() => void thread.refetch()}
            retrying={thread.isFetching}
          />
        ) : thread.data.items.length === 0 && !waiting ? (
          <div className="m-auto max-w-xs py-6 text-center">
            <p className="font-medium">{t.chat.intro}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.chat.introHint}</p>
          </div>
        ) : (
          thread.data.items.map((item) =>
            item.role === 'student' ? (
              <StudentBubble key={item.key} item={item} onRetry={() => retry(item)} />
            ) : (
              <AssistantBubble
                key={item.key}
                item={item}
                topicId={topicId}
                onSourceClick={onSourceClick}
              />
            ),
          )
        )}
        {waiting && <Typing />}
      </div>

      <div className="border-t px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div
          role="group"
          aria-label={t.chat.quickActions}
          className="-mx-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-3 pb-2"
        >
          {quickActions.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              disabled={waiting || !loaded}
              onClick={() => submit(action)}
              className="min-h-9 shrink-0 cursor-pointer rounded-full border bg-background px-3 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_TEXT}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={t.chat.placeholder}
            aria-label={t.chat.placeholder}
            enterKeyHint="send"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-base leading-snug outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40"
          />
          <Button
            type="submit"
            size="icon"
            disabled={waiting || !loaded || !draft.trim()}
            aria-label={t.chat.send}
          >
            <SendHorizontal className="size-5" aria-hidden />
          </Button>
        </form>
      </div>
    </section>
  )
}

function StudentBubble({ item, onRetry }: { item: ChatItem; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-end gap-1.5" data-chat-item="student">
      {item.quote && (
        <blockquote className="max-w-[85%] border-r-2 border-primary/50 pr-3 text-right text-sm text-muted-foreground">
          <MathText text={item.quote} className="line-clamp-4" />
        </blockquote>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground',
          item.status === 'sending' && 'opacity-70',
        )}
      >
        {item.text && <p className="whitespace-pre-wrap">{item.text}</p>}
        {item.action && (
          <p className={cn('text-sm font-medium', item.text && 'mt-1 opacity-85')}>
            {actionLabel(item.action)}
          </p>
        )}
      </div>
      {item.status === 'error' && (
        <div className="flex max-w-[85%] flex-col items-end gap-1 text-right" role="alert">
          <p className="text-sm text-danger">{item.error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw aria-hidden />
            {t.chat.retry}
          </Button>
        </div>
      )}
    </div>
  )
}

const noticeLabel: Record<NonNullable<ChatItem['notice']>, string> = {
  not_covered: t.chat.notCovered,
  off_topic: t.chat.offTopic,
  refused: t.chat.refusedQuiz,
}

function AssistantBubble({
  item,
  topicId,
  onSourceClick,
}: {
  item: ChatItem
  topicId: number
  onSourceClick?: (source: ChatSource) => void
}) {
  // One chip per page, in page order.
  const sources = [...new Map(item.sources.map((s) => [s.page ?? `c${s.chunkId}`, s])).values()]
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))
    .slice(0, 4)

  return (
    <div className="flex flex-col items-start gap-2" data-chat-item="assistant">
      {item.notice ? (
        <div className="max-w-[92%] rounded-2xl border border-dashed bg-muted px-4 py-3 text-foreground">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Info className="size-4" aria-hidden />
            {noticeLabel[item.notice]}
          </p>
          <ChatMarkdown text={item.text} />
        </div>
      ) : (
        <div className="max-w-[92%] rounded-2xl rounded-bl-md border bg-background px-4 py-3">
          <ChatMarkdown text={item.text} />
        </div>
      )}
      {sources.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t.chat.sources}>
          {sources.map((source) => {
            const label = source.page ? t.chat.source(source.page) : t.chat.sourceNoPage
            const chip =
              'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 text-sm font-medium text-primary-soft-foreground hover:brightness-95'
            return (
              <li key={`${source.chunkId}-${source.page}`}>
                {onSourceClick ? (
                  <button type="button" className={chip} onClick={() => onSourceClick(source)}>
                    <BookOpen className="size-4" aria-hidden />
                    {label}
                  </button>
                ) : (
                  <Link className={chip} to={paths.topic(topicId, { page: source.page })}>
                    <BookOpen className="size-4" aria-hidden />
                    {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Typing() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span
        className="flex gap-1 rounded-2xl rounded-bl-md border bg-background px-3 py-3"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {t.chat.typing}
    </div>
  )
}
