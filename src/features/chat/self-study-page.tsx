import {
  BookOpen,
  ChevronRight,
  Dumbbell,
  Library,
  MessageCircleMore,
  Sparkles,
  SmilePlus,
} from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useMastery, useWeakTopics } from '@/api/me'
import type { WeakTopic } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { MathText } from '@/components/math-text'
import { StatusChip } from '@/components/status-chip'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

export function SelfStudyPage() {
  const weak = useWeakTopics()

  return (
    <>
      <PageHeader title={t.selfStudy.title} subtitle={t.selfStudy.subtitle} />

      <section aria-labelledby="weak-title">
        <h2 id="weak-title" className="mb-3 text-lg font-semibold">
          {t.selfStudy.weakTitle}
        </h2>
        {weak.isPending ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        ) : weak.isError ? (
          <ErrorState
            message={errorMessage(weak.error)}
            onRetry={() => void weak.refetch()}
            retrying={weak.isFetching}
          />
        ) : weak.data.length === 0 ? (
          <EmptyState
            icon={SmilePlus}
            title={t.selfStudy.emptyTitle}
            description={t.selfStudy.emptyHint}
            action={
              <Button asChild variant="outline">
                <Link to={paths.topics}>
                  <Library aria-hidden />
                  {t.selfStudy.toTopics}
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {weak.data.map((topic) => (
              <li key={topic.topicId}>
                <WeakTopicCard topic={topic} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AllTopics />
    </>
  )
}

function WeakTopicCard({ topic }: { topic: WeakTopic }) {
  const first = topic.subSkills[0]
  const question = first
    ? t.selfStudy.suggestedQuestion(first)
    : t.selfStudy.suggestedTopicQuestion(topic.title)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold">{topic.title}</h3>
          <p className="text-sm text-muted-foreground">
            {topic.subject}
            {topic.openMistakes > 0 && ` · ${t.selfStudy.openMistakes(topic.openMistakes)}`}
          </p>
        </div>
        <StatusChip status={topic.status} />
      </div>

      {topic.subSkills.length > 0 && (
        <div className="mt-3 rounded-xl bg-warning-soft/60 px-4 py-3">
          <p className="mb-1.5 text-sm font-semibold text-warning">{t.selfStudy.whatWentWrong}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
            {topic.subSkills.slice(0, 3).map((skill) => (
              <li key={skill}>
                <MathText text={skill} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button asChild block>
          <Link to={paths.chat(topic.topicId, question)}>
            <Sparkles aria-hidden />
            {t.selfStudy.learnWithAi}
          </Link>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.topic(topic.topicId)}>
              <BookOpen aria-hidden />
              {t.selfStudy.readTextbook}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={paths.practice(topic.topicId)}>
              <Dumbbell aria-hidden />
              {t.selfStudy.practice}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="col-span-2">
            <Link to={paths.checkpoint(topic.topicId)}>
              <MessageCircleMore aria-hidden />
              {t.selfStudy.checkpoint}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function AllTopics() {
  const mastery = useMastery()
  if (!mastery.data?.topics.length) return null

  return (
    <section className="mt-8" aria-labelledby="all-topics">
      <h2 id="all-topics" className="mb-3 text-lg font-semibold">
        {t.selfStudy.allTopics}
      </h2>
      <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
        {mastery.data.topics.map((topic) => (
          <li key={topic.topicId} className="border-b last:border-b-0">
            <Link
              to={paths.topic(topic.topicId)}
              className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{topic.title}</p>
                <p className="text-sm text-muted-foreground">{topic.subject}</p>
                <StatusChip status={topic.status} className="mt-1.5" />
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
