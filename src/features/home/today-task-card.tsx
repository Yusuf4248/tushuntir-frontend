import { ArrowRight, BookOpenCheck, Clock, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useQuizzes, useToday } from '@/api/me'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { SkeletonCard } from '@/components/ui/skeleton'
import { paths } from '@/routes/paths'
import { t } from '@/lib/strings.uz'
import { DEFAULT_TIMEZONE, URGENT_MS, relativeDayTime, timeLeft, useNow } from '@/lib/time'

import { byDueSoonest, hasOpenAttempt } from './quiz-utils'

export function TodayTaskCard() {
  const quizzes = useQuizzes()
  const today = useToday()
  const now = useNow()

  if (quizzes.isPending) return <SkeletonCard lines={3} className="h-44" />
  if (quizzes.isError) {
    return (
      <ErrorState
        message={errorMessage(quizzes.error)}
        onRetry={() => void quizzes.refetch()}
        retrying={quizzes.isFetching}
      />
    )
  }

  const quiz = byDueSoonest(quizzes.data.available)[0]
  const timeZone = today.data?.timezone ?? DEFAULT_TIMEZONE

  if (!quiz) {
    // Tell the student when the next quiz opens, if a lesson is still running today.
    const nextLocked = today.data?.lessons.find(
      (lesson) => lesson.quiz?.status === 'locked' && lesson.endsAt,
    )
    return (
      <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-card sm:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <PartyPopper className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t.home.todayTask}</p>
          <p className="mt-0.5 font-semibold">{t.home.noTask}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {nextLocked?.endsAt
              ? t.home.nextUnlock(nextLocked.subject.name, nextLocked.endsAt)
              : t.home.noTaskHint}
          </p>
        </div>
      </div>
    )
  }

  const msLeft = quiz.dueAt ? Date.parse(quiz.dueAt) - now : null
  const urgent = msLeft !== null && msLeft < URGENT_MS
  const resume = hasOpenAttempt(quiz)

  return (
    <article className="rounded-xl border border-primary/25 bg-primary-soft p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary-soft-foreground">
        <BookOpenCheck className="size-4" aria-hidden />
        {t.home.todayTask}
      </p>
      <h2 className="mt-2 text-xl leading-snug font-bold">
        {quiz.topic?.title ?? quiz.title ?? quiz.subject.name}
      </h2>
      <p className="mt-1 text-muted-foreground">{quiz.subject.name}</p>

      {quiz.dueAt && msLeft !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip tone={urgent ? 'warning' : 'neutral'} icon={Clock} className="bg-card">
            {timeLeft(msLeft)}
          </Chip>
          <span className="text-sm text-muted-foreground">
            {t.time.until(
              relativeDayTime(quiz.dueAt, today.data?.date ?? '', timeZone).toLowerCase(),
            )}
          </span>
        </div>
      )}

      <Button asChild size="lg" block className="mt-4">
        <Link to={paths.quiz(quiz.quizId)}>
          {resume ? t.home.resume : t.home.start}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  )
}
