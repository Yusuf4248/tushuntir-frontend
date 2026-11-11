import { CheckCircle2, ChevronLeft, ChevronRight, Lock, SearchX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { ApiError, errorMessage } from '@/api/errors'
import { useMastery, useTopic } from '@/api/me'
import type { ChatSource, TopicDetail } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { MathText } from '@/components/math-text'
import { StatusChip } from '@/components/status-chip'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import type { AskRequest } from '@/features/chat/ask-actions'
import { ChatPanel, type PendingAsk } from '@/features/chat/chat-panel'
import { ChatSheet } from '@/features/chat/chat-sheet'
import { t } from '@/lib/strings.uz'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { paths } from '@/routes/paths'

import { AskableTextbook } from './askable-textbook'
import { TopicActions } from './topic-actions'
import { useTextbookFocus } from './use-textbook-focus'

export function TopicPage() {
  const topicId = Number(useParams().topicId)
  const topic = useTopic(topicId)

  if (topic.isPending) return <TopicSkeleton />
  if (topic.isError) {
    const notFound = topic.error instanceof ApiError && topic.error.status === 404
    return (
      <>
        <PageHeader title={notFound ? t.topics.notFound : t.topics.title} backTo={paths.topics} />
        {notFound ? (
          <EmptyState
            icon={SearchX}
            title={t.topics.notFound}
            description={t.topics.notFoundHint}
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={paths.topics}>{t.topics.backToTopics}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            message={errorMessage(topic.error)}
            onRetry={() => void topic.refetch()}
            retrying={topic.isFetching}
          />
        )}
      </>
    )
  }
  return <TopicView key={topicId} topic={topic.data} />
}

function TopicView({ topic }: { topic: TopicDetail }) {
  const [searchParams] = useSearchParams()
  const { highlightedId, focus } = useTextbookFocus(topic.paragraphs)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [ask, setAsk] = useState<PendingAsk | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function askAi(request: AskRequest) {
    setAsk({ request, nonce: Date.now() })
    if (!isDesktop) setSheetOpen(true)
  }

  function openChat() {
    if (isDesktop) panelRef.current?.querySelector('textarea')?.focus()
    else setSheetOpen(true)
  }

  // A source chip scrolls the textbook to that page; on phones once the sheet has closed.
  const pendingSource = useRef<ChatSource | null>(null)
  function showSource(source: ChatSource) {
    if (isDesktop) {
      focus({ page: source.page, chunkId: source.chunkId })
      return
    }
    pendingSource.current = source
    setSheetOpen(false)
  }
  function afterSheetClosed(): boolean {
    const source = pendingSource.current
    pendingSource.current = null
    if (!source) return false
    focus({ page: source.page, chunkId: source.chunkId })
    return true
  }

  const clearAsk = useCallback(() => setAsk(null), [])

  // From the mistake review: ?paragraph=ID (or ?page=N) scrolls there and highlights it once.
  const paragraphParam = searchParams.get('paragraph')
  const pageParam = Number(searchParams.get('page'))
  const focusedFor = useRef<string | null>(null)
  useEffect(() => {
    const key = `${paragraphParam ?? ''}|${pageParam || ''}`
    if (key === '|' || focusedFor.current === key) return
    focusedFor.current = key
    focus({ paragraphId: paragraphParam, page: pageParam > 0 ? pageParam : null })
  }, [paragraphParam, pageParam, focus])

  const subtitle = [topic.subject.name, topic.chapter.title].filter(Boolean).join(' · ')

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:gap-10">
      <article className="min-w-0">
        <PageHeader title={topic.title} subtitle={subtitle} backTo={paths.topics} />

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={topic.status} />
          {!topic.unlocked && <StatusChip status="locked" />}
        </div>
        {!topic.unlocked && (
          <p className="mt-3 text-sm text-muted-foreground">
            <Lock className="mr-1.5 inline size-4 align-[-2px]" aria-hidden />
            {t.topics.topicLocked}
          </p>
        )}

        <div className="mt-5">
          <TopicActions topicId={topic.topicId} onOpenChat={openChat} />
        </div>

        {topic.summary && (
          <Card className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">{t.topicPage.summary}</h2>
            <MathText text={topic.summary} className="block leading-relaxed" />
          </Card>
        )}

        {topic.keyIdeas.length > 0 && (
          <section className="mt-6" aria-labelledby="key-ideas">
            <h2 id="key-ideas" className="mb-3 text-lg font-semibold">
              {t.topicPage.keyIdeas}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {topic.keyIdeas.map((idea) => (
                <li key={idea} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <MathText text={idea} className="leading-relaxed" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8" aria-labelledby="textbook-text">
          <h2 id="textbook-text" className="mb-3 text-lg font-semibold">
            {t.topicPage.textbook}
          </h2>
          {topic.paragraphs.length === 0 ? (
            <p className="text-muted-foreground">{t.topicPage.noText}</p>
          ) : (
            <AskableTextbook
              paragraphs={topic.paragraphs}
              highlightedId={highlightedId}
              onAsk={askAi}
            />
          )}
        </section>

        <TopicPager prevId={topic.prevTopicId} nextId={topic.nextTopicId} />
      </article>

      {/* One chat at a time: a side panel on desktop, a bottom sheet on phones. */}
      {isDesktop ? (
        <aside className="hidden lg:block">
          <div
            ref={panelRef}
            className="sticky top-8 h-[calc(100dvh-4rem)] overflow-hidden rounded-2xl border shadow-card"
          >
            <ChatPanel
              className="h-full"
              topicId={topic.topicId}
              topicTitle={topic.title}
              ask={ask}
              onAskHandled={clearAsk}
              onSourceClick={showSource}
            />
          </div>
        </aside>
      ) : (
        <ChatSheet open={sheetOpen} onOpenChange={setSheetOpen} onClosed={afterSheetClosed}>
          <ChatPanel
            className="min-h-0 flex-1"
            topicId={topic.topicId}
            topicTitle={topic.title}
            ask={ask}
            onAskHandled={clearAsk}
            onSourceClick={showSource}
            onClose={() => setSheetOpen(false)}
          />
        </ChatSheet>
      )}
    </div>
  )
}

function TopicPager({ prevId, nextId }: { prevId: number | null; nextId: number | null }) {
  const mastery = useMastery()
  const titleOf = (id: number) => mastery.data?.topics.find((m) => m.topicId === id)?.title
  if (prevId === null && nextId === null) return null

  return (
    <nav className="mt-10 grid grid-cols-2 gap-3 border-t pt-5" aria-label={t.topics.title}>
      {prevId !== null ? (
        <Link
          to={paths.topic(prevId)}
          className="flex min-h-16 items-center gap-2 rounded-xl border bg-card p-3 shadow-card hover:bg-muted"
        >
          <ChevronLeft className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{t.topicPage.prevTopic}</span>
            <span className="line-clamp-2 text-sm font-medium">{titleOf(prevId) ?? ''}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {nextId !== null && (
        <Link
          to={paths.topic(nextId)}
          className="flex min-h-16 items-center justify-end gap-2 rounded-xl border bg-card p-3 text-right shadow-card hover:bg-muted"
        >
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{t.topicPage.nextTopic}</span>
            <span className="line-clamp-2 text-sm font-medium">{titleOf(nextId) ?? ''}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </nav>
  )
}

function TopicSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="mb-2 h-8 w-3/4" />
      <Skeleton className="mb-5 h-4 w-1/2" />
      <SkeletonCard lines={3} />
      <div className="mt-6 flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}
