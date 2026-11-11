import { ChevronRight, Library, Lock } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useMastery } from '@/api/me'
import type { MasteryTopic } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { StatusChip } from '@/components/status-chip'
import { EmptyState, ErrorState } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { groupTopics, type NumberedTopic } from './group-topics'

export function TopicsPage() {
  const mastery = useMastery()

  return (
    <>
      <PageHeader title={t.topics.title} />

      {mastery.isPending ? (
        <TopicsSkeleton />
      ) : mastery.isError ? (
        <ErrorState
          message={errorMessage(mastery.error)}
          onRetry={() => void mastery.refetch()}
          retrying={mastery.isFetching}
        />
      ) : mastery.data.topics.length === 0 ? (
        <EmptyState icon={Library} title={t.topics.empty} description={t.topics.emptyHint} />
      ) : (
        <>
          {mastery.data.topics.some((topic) => !topic.unlocked) && (
            <p className="mb-5 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t.topics.lockedNote}
            </p>
          )}
          <TopicGroups topics={mastery.data.topics} />
        </>
      )}
    </>
  )
}

function TopicGroups({ topics }: { topics: MasteryTopic[] }) {
  return groupTopics(topics).map((subject) => (
    <section key={subject.subject} className="mb-8" aria-label={subject.subject}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{subject.subject}</h2>
        <span className="text-sm text-muted-foreground">{t.topics.count(subject.count)}</span>
      </div>
      {subject.chapters.map((group, i) => (
        <div key={`${group.chapter ?? ''}-${i}`} className="mb-4">
          <h3 className="mb-2 px-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {group.chapter ?? t.topics.noChapter}
          </h3>
          <ol className="overflow-hidden rounded-xl border bg-card shadow-card">
            {group.topics.map((topic) => (
              <TopicRow key={topic.topicId} topic={topic} />
            ))}
          </ol>
        </div>
      ))}
    </section>
  ))
}

function TopicRow({ topic }: { topic: NumberedTopic }) {
  return (
    <li className="border-b last:border-b-0">
      <Link
        to={paths.topic(topic.topicId)}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground tabular-nums"
        >
          {topic.number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{topic.title}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusChip status={topic.status} />
            {!topic.unlocked && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="size-4" aria-hidden />
                <span className="sr-only">{t.topics.lockedLabel}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}

function TopicsSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="mb-3 h-6 w-1/3" />
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
