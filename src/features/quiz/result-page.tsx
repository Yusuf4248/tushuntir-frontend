import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Lightbulb,
  MessageCircleMore,
  SearchX,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'

import { attemptKeys, fetchAttemptHistory, submitAttempt } from '@/api/attempts'
import { ApiError } from '@/api/errors'
import { useMastery } from '@/api/me'
import type { SubmitResult } from '@/api/types'
import { MathText } from '@/components/math-text'
import { StatusChip } from '@/components/status-chip'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { t } from '@/lib/strings.uz'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { Blocked, StartSkeleton } from './quiz-start-page'
import { quizErrorMessage } from './quiz-errors'

/** Score at or above this means the topic is "in progress" (docs/mastery-rules.md). */
const PASS_PERCENT = 80

class NotSubmitted extends Error {}

/**
 * The result arrives from submit and is cached. After a reload it is read again with submit,
 * which is idempotent, but only for attempts the history lists as finished, so an open attempt
 * is never submitted by opening this page.
 */
async function loadResult(attemptId: number, signal: AbortSignal): Promise<SubmitResult> {
  const history = await fetchAttemptHistory({ limit: 100 }, signal)
  const item = history.find((h) => h.kind !== 'checkpoint' && h.id === attemptId)
  if (!item) throw new ApiError(404, t.quiz.attemptLost)
  if (!item.finishedAt) throw new NotSubmitted()
  return submitAttempt(attemptId)
}

export function ResultPage() {
  const attemptId = Number(useParams().attemptId)
  const result = useQuery({
    queryKey: attemptKeys.result(attemptId),
    queryFn: ({ signal }) => loadResult(attemptId, signal),
    staleTime: Infinity,
    retry: false,
  })

  if (result.isPending) return <StartSkeleton />
  if (result.isError) {
    if (result.error instanceof NotSubmitted) {
      return <Navigate to={paths.attempt(attemptId)} replace />
    }
    return (
      <Blocked
        icon={SearchX}
        title={t.quiz.attemptLost}
        description={quizErrorMessage(result.error)}
      />
    )
  }
  return <ResultView result={result.data} />
}

function ResultView({ result }: { result: SubmitResult }) {
  const mastery = useMastery()
  useDocumentTitle(t.result.title)
  const topicId = result.mastery?.topicId ?? null
  const topic = mastery.data?.topics.find((item) => item.topicId === topicId)
  const mistakes = result.totalQuestions - result.correctCount
  const passed = result.scorePercent >= PASS_PERCENT
  const questions = [...result.questions].sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-1 flex-col">
      <header className="mb-2">
        <p className="text-sm text-muted-foreground">{t.result.title}</p>
        {topic && <p className="font-semibold">{topic.title}</p>}
      </header>

      <section
        aria-label={t.result.scoreLabel(
          result.correctCount,
          result.totalQuestions,
          result.scorePercent,
        )}
        className={cn(
          'mt-3 rounded-2xl border p-5 text-center',
          passed ? 'border-success/30 bg-success-soft' : 'border-warning/30 bg-warning-soft',
        )}
      >
        <p className="text-5xl leading-none font-bold tabular-nums" aria-hidden>
          {t.result.score(result.correctCount, result.totalQuestions)}
          <span className="text-2xl font-semibold text-muted-foreground">
            {' · '}
            {t.result.percent(result.scorePercent)}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {result.mastery && <StatusChip status={result.mastery.status} className="bg-card" />}
          {result.hintsUsed > 0 && (
            <Chip icon={Lightbulb} className="bg-card">
              {t.result.hintsUsed(result.hintsUsed)}
            </Chip>
          )}
        </div>
        <p className="mt-4 text-lg font-medium text-balance">
          {passed ? t.result.great : t.result.notYet}
        </p>
      </section>

      <section className="mt-6" aria-labelledby="result-questions">
        <h2 id="result-questions" className="mb-3 text-lg font-semibold">
          {t.result.questions}
        </h2>
        <ol className="overflow-hidden rounded-xl border bg-card shadow-card">
          {questions.map((q) => (
            <li key={q.questionId} className="flex items-start gap-3 border-b p-4 last:border-b-0">
              {q.isCorrect ? (
                <CircleCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
              ) : (
                <CircleX className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  {t.quiz.questionLabel(q.position)} ·{' '}
                  <span className={q.isCorrect ? 'text-success' : 'text-danger'}>
                    {q.isCorrect
                      ? t.result.correct
                      : q.yourAnswer === null
                        ? t.result.unanswered
                        : t.result.wrong}
                  </span>
                </p>
                <MathText text={q.prompt} className="mt-0.5 line-clamp-2 block" />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:mx-0 md:border-0 md:px-0">
        {mistakes > 0 ? (
          <Button asChild size="lg" block>
            <Link to={paths.attemptReview(result.attemptId)} state={{ topicId }}>
              {t.result.reviewMistakes}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : (
          topicId !== null && (
            <Button asChild size="lg" block>
              <Link to={paths.checkpoint(topicId)}>
                <MessageCircleMore aria-hidden />
                {t.result.checkpoint}
              </Link>
            </Button>
          )
        )}
        <Button asChild variant="outline" block>
          <Link to={paths.home}>{t.result.toHome}</Link>
        </Button>
      </div>
    </div>
  )
}
