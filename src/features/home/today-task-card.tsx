import { ArrowRight, BookOpenCheck, Clock, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useQuizzes, useToday } from '@/api/me'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
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
      <div className="flex items-start gap-4 rounded-2xl border-2 border-dashed border-input bg-katak p-4 sm:p-5">
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
    <article
      className="relative overflow-hidden rounded-2xl border-2 border-ink bg-primary p-5 text-primary-foreground shadow-card"
      style={{
        backgroundImage:
          'linear-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.09) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/85">
        <BookOpenCheck className="size-4" aria-hidden />
        {t.home.todayTask}
        <span aria-hidden>·</span>
        {quiz.subject.name}
      </p>
      <h2 className="mt-2 text-xl leading-snug font-bold break-words">
        {quiz.topic?.title ?? quiz.title ?? quiz.subject.name}
      </h2>

      {quiz.dueAt && msLeft !== null && (
        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
          <p
            className={
              urgent
                ? 'rounded-lg bg-sardor px-2.5 py-1 font-display text-lg font-semibold text-on-sardor'
                : 'font-display text-lg font-semibold'
            }
          >
            <Clock className="mr-1.5 inline size-4 align-[-2px]" aria-hidden />
            {timeLeft(msLeft)}
          </p>
          <p className="text-sm text-primary-foreground/85">
            {t.time.until(
              relativeDayTime(quiz.dueAt, today.data?.date ?? '', timeZone).toLowerCase(),
            )}
          </p>
        </div>
      )}

      <Button
        asChild
        size="lg"
        block
        className="mt-5 bg-card text-foreground hover:bg-sardor-soft focus-visible:outline-primary-foreground"
      >
        <Link to={paths.quiz(quiz.quizId)}>
          {resume ? t.home.resume : t.home.start}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  )
}
