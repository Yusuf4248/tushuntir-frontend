import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  Loader2,
  Send,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { attemptKeys, requestHint, submitAttempt } from '@/api/attempts'
import { errorMessage } from '@/api/errors'
import { meKeys } from '@/api/me'
import type { AttemptView, HintResult } from '@/api/types'
import { MathText } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useToast } from '@/components/ui/toast'
import { t } from '@/lib/strings.uz'
import { useDocumentTitle } from '@/lib/use-document-title'
import { paths } from '@/routes/paths'

import { AnswerInput } from './answer-input'
import { attemptStorage } from './attempt-storage'
import { HintSheet } from './hint-sheet'
import { QuestionDots } from './question-dots'
import { DeadlinePassed } from './quiz-start-page'
import { quizProblem } from './quiz-errors'
import { useAnswerSaver, type SaveStatus } from './use-answer-saver'

const SHORT_ANSWER_DEBOUNCE_MS = 800
const SAVE_FAILED = 'answers-not-saved'

type LevelTexts = Record<number, string>

export function QuizRunner({ view }: { view: AttemptView }) {
  const attemptId = view.attemptId
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()

  const questions = useMemo(
    () => [...view.questions].sort((a, b) => a.position - b.position),
    [view.questions],
  )
  const total = questions.length

  // Restore this tab's copy (answers typed but maybe unsent, hint texts, misconceptions).
  const [stored] = useState(() => attemptStorage.load(attemptId))
  const kind = stored?.kind ?? (view.dueAt ? 'quiz' : 'practice')
  const topicId = stored?.topicId ?? null

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const fromServer: Record<number, string> = {}
    for (const q of questions) if (q.answer !== null) fromServer[q.questionId] = q.answer
    return { ...fromServer, ...stored?.answers }
  })
  const [hints, setHints] = useState<Record<number, LevelTexts>>(() => {
    const fromServer: Record<number, LevelTexts> = {}
    for (const q of questions) {
      if (q.hints?.length) {
        fromServer[q.questionId] = Object.fromEntries(q.hints.map((text, i) => [i + 1, text]))
      }
    }
    return { ...stored?.hints, ...fromServer }
  })
  const [hintsUsed, setHintsUsed] = useState<Record<number, number>>(() =>
    Object.fromEntries(questions.map((q) => [q.questionId, q.hintsUsed])),
  )
  const [misconceptions, setMisconceptions] = useState<Record<number, string>>(
    () => stored?.misconceptions ?? {},
  )
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  useDocumentTitle(kind === 'quiz' ? t.quiz.lessonQuiz : t.quiz.practiceQuiz)
  const [hintOpen, setHintOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const index = Math.min(Math.max(Number(searchParams.get('q') ?? 1) - 1 || 0, 0), total - 1)
  const question = questions[index]

  function handleFatal(error: unknown): boolean {
    const problem = quizProblem(error)
    if (problem === 'deadline') {
      setDeadlinePassed(true)
      return true
    }
    if (problem === 'submitted') {
      void navigate(paths.attemptResult(attemptId), { replace: true })
      return true
    }
    return false
  }

  const saver = useAnswerSaver(
    attemptId,
    Object.fromEntries(
      questions.filter((q) => q.answer !== null).map((q) => [q.questionId, q.answer ?? '']),
    ),
    answers,
    (error) => {
      if (!handleFatal(error)) toast({ variant: 'error', title: errorMessage(error) })
    },
  )

  // Keep this tab's copy current (fallback for reloads).
  useEffect(() => {
    attemptStorage.save({ view, kind, topicId, answers, hints, misconceptions })
  }, [view, kind, topicId, answers, hints, misconceptions])

  const hint = useMutation({
    mutationFn: async (questionId: number) => {
      // The misconception depends on the saved answer, so save it first.
      await saver.flush(questionId)
      return requestHint(attemptId, questionId)
    },
    onSuccess: (res: HintResult) => {
      setHints((h) => ({ ...h, [res.questionId]: { ...h[res.questionId], [res.level]: res.hint } }))
      setHintsUsed((u) => ({ ...u, [res.questionId]: res.hintsUsed }))
      setMisconceptions((m) => {
        const next = { ...m }
        if (res.misconception) next[res.questionId] = res.misconception
        else delete next[res.questionId]
        return next
      })
    },
    onError: (error) => {
      if (!handleFatal(error)) toast({ variant: 'error', title: errorMessage(error) })
    },
  })

  const submit = useMutation({
    mutationFn: async () => {
      if (!(await saver.flushAll())) throw new Error(SAVE_FAILED)
      return submitAttempt(attemptId)
    },
    onSuccess: (result) => {
      queryClient.setQueryData(attemptKeys.result(attemptId), result)
      queryClient.removeQueries({ queryKey: attemptKeys.view(attemptId) })
      attemptStorage.clear(attemptId)
      void queryClient.invalidateQueries({ queryKey: meKeys.all })
      void navigate(paths.attemptResult(attemptId), {
        replace: true,
        state: { kind, topicId: result.mastery?.topicId ?? topicId },
      })
    },
    onError: (error) => {
      if (error instanceof Error && error.message === SAVE_FAILED) return // saver already told
      if (!handleFatal(error)) toast({ variant: 'error', title: errorMessage(error) })
    },
  })

  if (deadlinePassed) return <DeadlinePassed />
  if (!question) return null

  const isAnswered = (i: number) => {
    const q = questions[i]
    return q ? Boolean(answers[q.questionId]?.trim()) : false
  }
  const unanswered = questions.filter((_, i) => !isAnswered(i)).length
  const value = answers[question.questionId] ?? ''
  const used = hintsUsed[question.questionId] ?? 0
  const isLast = index === total - 1

  function goTo(next: number) {
    if (!question) return
    void saver.flush(question.questionId)
    setSearchParams({ q: String(next + 1) }, { replace: true })
    window.scrollTo({ top: 0 })
  }

  function setAnswer(text: string, delayMs: number) {
    if (!question) return
    setAnswers((a) => ({ ...a, [question.questionId]: text }))
    saver.save(question.questionId, text, delayMs)
  }

  function onSubmit() {
    if (unanswered > 0) setConfirmOpen(true)
    else submit.mutate()
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link to={paths.home} aria-label={`${t.quiz.exit}. ${t.quiz.exitHint}`}>
            <X className="size-6" aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">
            {kind === 'quiz' ? t.quiz.lessonQuiz : t.quiz.practiceQuiz}
          </p>
          <p className="font-semibold tabular-nums" aria-live="polite">
            {t.quiz.progress(index + 1, total)}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onSubmit} loading={submit.isPending}>
          {!submit.isPending && <Send aria-hidden />}
          {t.quiz.submit}
        </Button>
      </header>

      <ProgressBar
        className="mt-3"
        value={index + 1}
        max={total}
        label={t.quiz.questionNav}
        valueText={t.quiz.progress(index + 1, total)}
      />
      <div className="mt-2">
        <QuestionDots count={total} current={index} isAnswered={isAnswered} onSelect={goTo} />
      </div>

      <main className="mt-4 flex-1">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            {t.quiz.questionLabel(index + 1)}
          </p>
          <SaveIndicator
            status={saver.status[question.questionId]}
            onRetry={() => void saver.flush(question.questionId)}
          />
        </div>
        <h1
          id={`prompt-${question.questionId}`}
          className="mb-5 text-xl leading-snug font-semibold"
        >
          <MathText text={question.prompt} />
        </h1>

        <AnswerInput
          key={question.questionId}
          question={question}
          promptId={`prompt-${question.questionId}`}
          value={value}
          onChoose={(option) => setAnswer(option, 0)}
          onType={(text) => setAnswer(text, SHORT_ANSWER_DEBOUNCE_MS)}
          onTypeDone={() => void saver.flush(question.questionId)}
        />

        {question.hintsAvailable > 0 && (
          <Button
            variant="ghost"
            className="mt-4 -ml-2 text-primary"
            onClick={() => setHintOpen(true)}
          >
            <Lightbulb aria-hidden />
            {t.quiz.help}
            {used > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                · {t.quiz.hintsUsed(used, question.hintsAvailable)}
              </span>
            )}
          </Button>
        )}
      </main>

      <footer className="sticky bottom-0 -mx-4 mt-6 grid grid-cols-2 gap-3 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:mx-0 md:border-0 md:px-0">
        <Button variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ArrowLeft aria-hidden />
          {t.quiz.previous}
        </Button>
        {isLast ? (
          <Button onClick={onSubmit} loading={submit.isPending}>
            {submit.isPending ? t.quiz.submitting : t.quiz.submit}
          </Button>
        ) : (
          <Button onClick={() => goTo(index + 1)}>
            {t.quiz.next}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </footer>

      <HintSheet
        open={hintOpen}
        onOpenChange={setHintOpen}
        hints={hints[question.questionId] ?? {}}
        used={used}
        available={question.hintsAvailable}
        misconception={misconceptions[question.questionId] ?? null}
        onRequest={() => hint.mutate(question.questionId)}
        loading={hint.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.quiz.confirmUnanswered(unanswered)}
        description={t.quiz.confirmUnansweredHint}
        confirmLabel={t.quiz.confirmSubmit}
        cancelLabel={t.quiz.keepGoing}
        onConfirm={() => submit.mutate()}
      />
    </div>
  )
}

function SaveIndicator({ status, onRetry }: { status?: SaveStatus; onRetry: () => void }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t.quiz.saving}
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-success" role="status">
        <CircleCheck className="size-4" aria-hidden />
        {t.quiz.saved}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="-my-2 flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-danger"
      >
        <CircleAlert className="size-4" aria-hidden />
        {t.quiz.saveFailed} · {t.quiz.retrySave}
      </button>
    )
  }
  return null
}
