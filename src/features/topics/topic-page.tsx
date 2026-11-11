import { ChevronRight, Dumbbell, ListChecks, Lock, MessageCircleMore, SearchX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useMastery } from '@/api/me'
import { PageHeader } from '@/components/layout/page-header'
import { StatusChip } from '@/components/status-chip'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

/** Placeholder until the textbook endpoint exists: title, status and the three actions. */
export function TopicPage() {
  const topicId = Number(useParams().topicId)
  const mastery = useMastery()

  if (mastery.isPending) {
    return (
      <div aria-hidden>
        <Skeleton className="mb-5 h-8 w-3/4" />
        <SkeletonCard lines={2} />
      </div>
    )
  }

  if (mastery.isError) {
    return (
      <>
        <PageHeader title={t.topics.title} backTo={paths.topics} />
        <ErrorState
          message={errorMessage(mastery.error)}
          onRetry={() => void mastery.refetch()}
          retrying={mastery.isFetching}
        />
      </>
    )
  }

  const topic = mastery.data.topics.find((item) => item.topicId === topicId)
  if (!topic) {
    return (
      <>
        <PageHeader title={t.topics.notFound} backTo={paths.topics} />
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
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={topic.title}
        subtitle={[topic.subject, topic.chapter].filter(Boolean).join(' · ')}
        backTo={paths.topics}
      />

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

      <div className="mt-6 flex flex-col gap-3">
        <ActionLink
          to={paths.topicQuiz(topic.topicId)}
          icon={ListChecks}
          title={t.topics.quiz}
          hint={t.topics.quizHint}
          primary
        />
        <ActionLink
          to={paths.practice(topic.topicId)}
          icon={Dumbbell}
          title={t.topics.practice}
          hint={t.topics.practiceHint}
        />
        <ActionLink
          to={paths.checkpoint(topic.topicId)}
          icon={MessageCircleMore}
          title={t.topics.explain}
          hint={t.topics.explainHint}
        />
      </div>
    </>
  )
}

type ActionLinkProps = {
  to: string
  icon: LucideIcon
  title: string
  hint: string
  primary?: boolean
}

function ActionLink({ to, icon: Icon, title, hint, primary }: ActionLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-16 items-center gap-4 rounded-xl border p-4 shadow-card transition-colors',
        primary
          ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary-hover'
          : 'bg-card hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          primary ? 'bg-primary-foreground/15' : 'bg-primary-soft text-primary-soft-foreground',
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{title}</span>
        <span
          className={cn(
            'block text-sm',
            primary ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {hint}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 opacity-70" aria-hidden />
    </Link>
  )
}
