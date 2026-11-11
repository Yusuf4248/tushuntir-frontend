import { AlarmClockOff, CalendarCheck, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useQuizzes, useToday } from '@/api/me'
import type { StudentQuiz } from '@/api/types'
import { EmptyState, ErrorState } from '@/components/states'
import { Chip } from '@/components/ui/chip'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { DEFAULT_TIMEZONE, URGENT_MS, relativeDayTime, useNow } from '@/lib/time'
import { paths } from '@/routes/paths'

import { byDueSoonest, byMostRecentlyDue } from './quiz-utils'
import { Section } from './section'

export function DeadlinesSection() {
  const quizzes = useQuizzes()
  const today = useToday()
  const now = useNow()
  const timeZone = today.data?.timezone ?? DEFAULT_TIMEZONE
  const todayDate = today.data?.date ?? ''

  return (
    <Section title={t.home.deadlines}>
      {quizzes.isPending ? (
        <SkeletonCard lines={3} />
      ) : quizzes.isError ? (
        <ErrorState
          message={errorMessage(quizzes.error)}
          onRetry={() => void quizzes.refetch()}
          retrying={quizzes.isFetching}
        />
      ) : quizzes.data.available.length + quizzes.data.overdue.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t.home.noDeadlines} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
          {byDueSoonest(quizzes.data.available).map((quiz) => (
            <DeadlineRow
              key={quiz.quizId}
              quiz={quiz}
              when={quiz.dueAt ? relativeDayTime(quiz.dueAt, todayDate, timeZone) : null}
              urgent={quiz.dueAt !== null && Date.parse(quiz.dueAt) - now < URGENT_MS}
            />
          ))}
          {byMostRecentlyDue(quizzes.data.overdue).map((quiz) => (
            <DeadlineRow
              key={quiz.quizId}
              quiz={quiz}
              when={quiz.dueAt ? relativeDayTime(quiz.dueAt, todayDate, timeZone) : null}
              overdue
            />
          ))}
        </ul>
      )}
    </Section>
  )
}

type DeadlineRowProps = {
  quiz: StudentQuiz
  when: string | null
  urgent?: boolean
  overdue?: boolean
}

function DeadlineRow({ quiz, when, urgent, overdue }: DeadlineRowProps) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium">
          {quiz.topic?.title ?? quiz.title ?? quiz.subject.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{quiz.subject.name}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {overdue ? (
          <Chip tone="danger" icon={AlarmClockOff}>
            {t.home.overdue}
          </Chip>
        ) : (
          when && (
            <Chip tone={urgent ? 'warning' : 'neutral'} icon={Clock}>
              {when}
            </Chip>
          )
        )}
      </div>
    </>
  )

  if (overdue) {
    return <li className="flex items-center gap-3 border-b p-4 last:border-b-0">{body}</li>
  }

  return (
    <li className="border-b last:border-b-0">
      <Link
        to={paths.quiz(quiz.quizId)}
        className="flex min-h-11 items-center gap-3 p-4 transition-colors hover:bg-muted"
      >
        {body}
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}
