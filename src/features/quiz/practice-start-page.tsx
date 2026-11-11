import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { startPractice } from '@/api/attempts'
import { errorMessage } from '@/api/errors'
import { useTopic } from '@/api/me'
import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { attemptStorage } from './attempt-storage'
import { StartSkeleton } from './quiz-start-page'
import { quizErrorMessage } from './quiz-errors'
import { StartScreen } from './start-screen'
import { useStartAttempt } from './use-start-attempt'

/** Backend constant (PRACTICE_QUESTIONS). */
const PRACTICE_QUESTIONS = 5

export function PracticeStartPage() {
  const topicId = Number(useParams().topicId)
  const topic = useTopic(topicId)
  // An unfinished practice from this tab (practice start always creates a new attempt).
  const [openAttemptId] = useState(() => attemptStorage.openPractice(topicId))
  const start = useStartAttempt('practice', topicId, () => startPractice(topicId))

  if (topic.isPending) return <StartSkeleton />
  if (topic.isError) {
    return (
      <>
        <PageHeader title={t.quiz.practiceQuiz} backTo={paths.topic(topicId)} backIcon="close" />
        <ErrorState
          message={errorMessage(topic.error)}
          onRetry={() => void topic.refetch()}
          retrying={topic.isFetching}
        />
      </>
    )
  }

  return (
    <StartScreen
      eyebrow={t.quiz.practiceQuiz}
      title={topic.data.title}
      subject={topic.data.subject.name}
      questionCount={PRACTICE_QUESTIONS}
      note={`${t.quiz.practiceAbout} ${t.quiz.rules}`}
      actionLabel={t.quiz.start}
      onStart={() => start.mutate()}
      starting={start.isPending}
      error={start.isError ? quizErrorMessage(start.error) : null}
      backTo={paths.topic(topicId)}
      secondaryAction={
        openAttemptId !== null && !start.isPending ? (
          <Button asChild variant="outline" size="lg" block>
            <Link to={paths.attempt(openAttemptId)}>{t.quiz.resume}</Link>
          </Button>
        ) : null
      }
    />
  )
}
