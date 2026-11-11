import { AlarmClockOff, CircleCheck, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'

import { startQuiz } from '@/api/attempts'
import { errorMessage } from '@/api/errors'
import { useQuizzes, useToday } from '@/api/me'
import type { StudentQuiz } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { DEFAULT_TIMEZONE, relativeDayTime } from '@/lib/time'
import { paths } from '@/routes/paths'

import { quizErrorMessage, quizProblem } from './quiz-errors'
import { StartScreen } from './start-screen'
import { useStartAttempt } from './use-start-attempt'

/** Backend constant (QUESTIONS_PER_ATTEMPT); used until StudentQuizDto carries questionCount. */
const LESSON_QUIZ_QUESTIONS = 10

export function QuizStartPage() {
  const quizId = Number(useParams().quizId)
  const quizzes = useQuizzes()

  if (quizzes.isPending) return <StartSkeleton />
  if (quizzes.isError) {
    return (
      <>
        <PageHeader title={t.quiz.lessonQuiz} backTo={paths.home} backIcon="close" />
        <ErrorState
          message={errorMessage(quizzes.error)}
          onRetry={() => void quizzes.refetch()}
          retrying={quizzes.isFetching}
        />
      </>
    )
  }

  const { available, done, overdue } = quizzes.data
  const quiz =
    available.find((q) => q.quizId === quizId) ??
    done.find((q) => q.quizId === quizId) ??
    overdue.find((q) => q.quizId === quizId)

  if (!quiz) {
    return <Blocked icon={SearchX} title={t.quiz.notFound} description={t.quiz.notFoundHint} />
  }
  if (quiz.status === 'done') return <AlreadyDone quiz={quiz} />
  if (quiz.status === 'overdue') return <DeadlinePassed />
  return <AvailableQuiz quiz={quiz} />
}

function AvailableQuiz({ quiz }: { quiz: StudentQuiz }) {
  const today = useToday()
  const start = useStartAttempt('quiz', quiz.topic?.id ?? null, () => startQuiz(quiz.quizId))

  const problem = start.isError ? quizProblem(start.error) : null
  if (problem === 'deadline') return <DeadlinePassed />
  if (problem === 'submitted') {
    return quiz.attempt ? (
      <Navigate to={paths.attemptResult(quiz.attempt.id)} replace />
    ) : (
      <AlreadyDone quiz={quiz} />
    )
  }

  const resume = quiz.attempt !== null && quiz.attempt.finishedAt === null
  const timeZone = today.data?.timezone ?? DEFAULT_TIMEZONE

  return (
    <StartScreen
      eyebrow={t.quiz.lessonQuiz}
      title={quiz.topic?.title ?? quiz.title ?? quiz.subject.name}
      subject={quiz.subject.name}
      questionCount={quiz.questionCount ?? LESSON_QUIZ_QUESTIONS}
      dueAt={quiz.dueAt}
      dueLabel={
        quiz.dueAt
          ? t.time.until(relativeDayTime(quiz.dueAt, today.data?.date ?? '', timeZone))
          : null
      }
      note={t.quiz.rules}
      actionLabel={resume ? t.quiz.resume : t.quiz.start}
      onStart={() => start.mutate()}
      starting={start.isPending}
      error={start.isError ? quizErrorMessage(start.error) : null}
      backTo={paths.home}
    />
  )
}

function AlreadyDone({ quiz }: { quiz: StudentQuiz }) {
  return (
    <Blocked
      icon={CircleCheck}
      title={t.quiz.doneTitle}
      description={t.quiz.doneHint}
      action={
        quiz.attempt ? (
          <Button asChild>
            <Link to={paths.attemptResult(quiz.attempt.id)}>{t.quiz.seeResult}</Link>
          </Button>
        ) : undefined
      }
    />
  )
}

export function DeadlinePassed() {
  return (
    <Blocked
      icon={AlarmClockOff}
      title={t.quiz.deadlineTitle}
      description={t.quiz.deadlinePassed}
    />
  )
}

type BlockedProps = {
  icon: typeof SearchX
  title: string
  description: string
  action?: ReactNode
}

export function Blocked({ icon, title, description, action }: BlockedProps) {
  return (
    <>
      <PageHeader title={t.quiz.lessonQuiz} backTo={paths.home} backIcon="close" />
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <div className="flex flex-col items-center gap-2">
            {action}
            <Button asChild variant="outline">
              <Link to={paths.home}>{t.quiz.toHome}</Link>
            </Button>
          </div>
        }
      />
    </>
  )
}

export function StartSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col gap-4 pt-14">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-4/5" />
      <SkeletonCard lines={2} />
    </div>
  )
}
