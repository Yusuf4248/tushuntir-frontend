import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  CircleCheck,
  CircleX,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  MessageCircleWarning,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { attemptKeys, confirmMistake } from '@/api/attempts'
import { errorMessage } from '@/api/errors'
import { meKeys } from '@/api/me'
import type { ConfirmResult, Mistake, Review } from '@/api/types'
import { MathText } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { AnswerInput } from './answer-input'

type MistakeCardProps = {
  attemptId: number
  mistake: Mistake
  topicId: number | null
}

export function MistakeCard({ attemptId, mistake, topicId }: MistakeCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 shadow-card sm:p-5',
        mistake.fixed && 'border-success/40',
      )}
      aria-label={t.quiz.questionLabel(mistake.position)}
    >
      <p className="text-sm font-semibold text-muted-foreground">
        {t.quiz.questionLabel(mistake.position)}
      </p>
      <h2 className="mt-1 text-lg leading-snug font-semibold">
        <MathText text={mistake.prompt} />
      </h2>

      <dl className="mt-4 flex flex-col gap-2">
        <div className="rounded-xl bg-danger-soft px-4 py-3">
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-danger">
            <CircleX className="size-4" aria-hidden />
            {t.review.yourAnswer}
          </dt>
          <dd className="mt-0.5">
            {mistake.yourAnswer ? <MathText text={mistake.yourAnswer} /> : t.review.noAnswer}
          </dd>
        </div>
        <div className="rounded-xl bg-success-soft px-4 py-3">
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <CircleCheck className="size-4" aria-hidden />
            {t.review.correctAnswer}
          </dt>
          <dd className="mt-0.5">
            <MathText text={mistake.correctAnswer} />
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-warning">
          <MessageCircleWarning className="size-4" aria-hidden />
          {t.review.whyWrong}
        </p>
        <MathText text={mistake.misconception} className="mt-1 block leading-relaxed" />
        {mistake.explanation && mistake.explanation !== mistake.misconception && (
          <>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{t.review.solution}</p>
            <MathText
              text={mistake.explanation}
              className="mt-1 block leading-relaxed text-muted-foreground"
            />
          </>
        )}
      </div>

      {topicId !== null && (
        <Button asChild variant="link" className="mt-2 -ml-1 h-11 px-1">
          <Link
            to={paths.topic(topicId, {
              page: mistake.page,
              paragraph: mistake.paragraphId ?? null,
            })}
          >
            <BookOpen aria-hidden />
            {mistake.page ? t.review.textbookPage(mistake.page) : t.review.textbook}
          </Link>
        </Button>
      )}

      <div className="mt-3 border-t pt-4">
        <Confirmation attemptId={attemptId} mistake={mistake} topicId={topicId} />
      </div>
    </article>
  )
}

function Confirmation({ attemptId, mistake, topicId }: MistakeCardProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [answer, setAnswer] = useState('')
  const [lastResult, setLastResult] = useState<ConfirmResult | null>(null)

  const confirm = useMutation({
    mutationFn: () => confirmMistake(attemptId, mistake.questionId, answer),
    onSuccess: (res) => {
      setLastResult(res)
      if (res.fixed) {
        queryClient.setQueryData<Review>(attemptKeys.review(attemptId), (review) =>
          review
            ? {
                ...review,
                fixedCount: review.mistakes.filter(
                  (m) => m.fixed || m.questionId === mistake.questionId,
                ).length,
                mistakes: review.mistakes.map((m) =>
                  m.questionId === mistake.questionId ? { ...m, fixed: true } : m,
                ),
              }
            : review,
        )
        void queryClient.invalidateQueries({ queryKey: meKeys.all })
      }
    },
    onError: (error) => toast({ variant: 'error', title: errorMessage(error) }),
  })

  if (mistake.fixed) {
    return (
      <div className="rounded-xl bg-success-soft px-4 py-3" role="status">
        <p className="font-semibold text-success">{t.review.fixed}</p>
        {lastResult?.explanation && (
          <MathText text={lastResult.explanation} className="mt-1 block text-sm leading-relaxed" />
        )}
      </div>
    )
  }

  if (mistake.confirmationStatus === 'pending' || !mistake.confirmation) {
    if (mistake.confirmationStatus === 'none') {
      return (
        <div>
          <p className="text-sm text-muted-foreground">{t.review.explainMoreHint}</p>
          {topicId !== null && (
            <Button asChild variant="secondary" className="mt-3">
              <Link to={paths.chat(topicId)}>
                <MessageCircleQuestion aria-hidden />
                {t.review.explainMore}
              </Link>
            </Button>
          )}
        </div>
      )
    }
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t.review.confirmationPending}
      </p>
    )
  }

  const question = mistake.confirmation
  const wrong = lastResult && !lastResult.correct

  // A new answer replaces the previous "try again" message.
  function change(value: string) {
    setAnswer(value)
    setLastResult(null)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!answer.trim()) {
          toast({ variant: 'info', title: t.review.chooseAnswer })
          return
        }
        confirm.mutate()
      }}
    >
      <p className="text-sm font-semibold text-primary">{t.review.checkTitle}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.review.checkHint}</p>
      <p id={`confirm-${question.questionId}`} className="mt-3 mb-3 font-medium">
        <MathText text={question.prompt} />
      </p>
      <AnswerInput
        question={question}
        promptId={`confirm-${question.questionId}`}
        value={answer}
        onChoose={change}
        onType={change}
        onTypeDone={() => undefined}
      />

      {wrong && (
        <div
          className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
          role="alert"
        >
          <p className="flex items-center gap-1.5 text-sm font-semibold text-warning">
            <Lightbulb className="size-4" aria-hidden />
            {t.review.tryAgain}
          </p>
          {(lastResult.hint ?? lastResult.feedback) && (
            <MathText
              text={lastResult.hint ?? lastResult.feedback ?? ''}
              className="mt-1 block text-sm leading-relaxed"
            />
          )}
        </div>
      )}

      <Button type="submit" className="mt-4" block loading={confirm.isPending}>
        {t.review.check}
      </Button>
    </form>
  )
}
