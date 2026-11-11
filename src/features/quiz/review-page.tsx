import { useQuery } from '@tanstack/react-query'
import { Dumbbell, MessageCircleMore, PartyPopper, SearchX, Sparkles } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'

import { attemptKeys, fetchAttemptHistory, fetchReview } from '@/api/attempts'
import { ApiError } from '@/api/errors'
import type { Review } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { MistakeCard } from './mistake-card'
import { Blocked } from './quiz-start-page'
import { quizErrorMessage } from './quiz-errors'

/** While some confirmation questions are still pending, re-check this often, this many times. */
const PENDING_POLL_MS = 5_000
const PENDING_POLL_MAX = 24

function isBusy(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500)
}

/** Topic of the review: ReviewDto.topicId, else what the result screen passed, else history. */
function useReviewTopic(attemptId: number, review: Review | undefined) {
  const fromState = (useLocation().state as { topicId?: number | null } | null)?.topicId ?? null
  const known = review?.topicId ?? fromState
  const history = useQuery({
    queryKey: [...attemptKeys.all, attemptId, 'topic'],
    queryFn: ({ signal }) => fetchAttemptHistory({ limit: 100 }, signal),
    enabled: review !== undefined && known === null,
    staleTime: Infinity,
  })
  const fromHistory =
    history.data?.find((h) => h.kind !== 'checkpoint' && h.id === attemptId)?.topic?.id ?? null
  return known ?? fromHistory
}

export function ReviewPage() {
  const attemptId = Number(useParams().attemptId)
  const review = useQuery({
    queryKey: attemptKeys.review(attemptId),
    queryFn: ({ signal }) => fetchReview(attemptId, signal),
    // The backend may still be preparing explanations: keep trying while it is busy.
    retry: (count, error) => count < 6 && isBusy(error),
    retryDelay: (count) => Math.min(2_000 * 2 ** count, 15_000),
    refetchInterval: (query) =>
      query.state.data?.mistakes.some((m) => m.confirmationStatus === 'pending') &&
      query.state.dataUpdateCount < PENDING_POLL_MAX
        ? PENDING_POLL_MS
        : false,
    refetchOnWindowFocus: false,
  })
  const topicId = useReviewTopic(attemptId, review.data)

  if (review.isPending) return <Preparing />
  if (review.isError) {
    return (
      <Blocked icon={SearchX} title={t.review.title} description={quizErrorMessage(review.error)} />
    )
  }

  const data = review.data
  const total = data.totalMistakes
  const pending = data.mistakes.some((m) => m.confirmationStatus === 'pending')
  const mistakes = [...data.mistakes].sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t.review.title}
        subtitle={data.topicTitle ?? undefined}
        backTo={paths.attemptResult(attemptId)}
        backIcon="close"
      />

      {total > 0 && <FixedProgress fixed={data.fixedCount} total={total} className="mb-4" live />}

      {pending && (
        <p
          className="mb-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <Sparkles className="size-4 shrink-0 animate-pulse" aria-hidden />
          {t.review.stillPreparing}
        </p>
      )}

      {total === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title={t.review.noMistakes}
          description={t.review.noMistakesHint}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {mistakes.map((mistake) => (
            <MistakeCard
              key={mistake.questionId}
              attemptId={attemptId}
              mistake={mistake}
              topicId={topicId}
            />
          ))}
        </div>
      )}

      <footer className="mt-6 flex flex-col gap-3 border-t pt-5 pb-[env(safe-area-inset-bottom)]">
        {total > 0 && <FixedProgress fixed={data.fixedCount} total={total} />}
        {topicId !== null && (
          <>
            <Button asChild size="lg" block>
              <Link to={paths.practice(topicId)}>
                <Dumbbell aria-hidden />
                {t.review.practice}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" block>
              <Link to={paths.checkpoint(topicId)}>
                <MessageCircleMore aria-hidden />
                {t.review.checkpoint}
              </Link>
            </Button>
          </>
        )}
      </footer>
    </div>
  )
}

function Preparing() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t.review.title} />
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Sparkles className="size-8 animate-pulse" aria-hidden />
        </span>
        <p className="text-lg font-semibold">{t.review.preparing}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{t.review.preparingHint}</p>
      </div>
      <div className="flex flex-col gap-4" aria-hidden>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  )
}

function FixedProgress({
  fixed,
  total,
  live,
  className,
}: {
  fixed: number
  total: number
  live?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p
        className="mb-1.5 text-sm font-medium tabular-nums"
        aria-live={live ? 'polite' : undefined}
      >
        {t.review.progress(fixed, total)}
      </p>
      <ProgressBar
        value={fixed}
        max={total}
        label={t.review.title}
        valueText={t.review.progress(fixed, total)}
      />
    </div>
  )
}
