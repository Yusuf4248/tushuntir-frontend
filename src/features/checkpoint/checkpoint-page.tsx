import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CircleAlert, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'

import {
  answerCheckpoint,
  checkpointKeys,
  fetchCheckpointStatus,
  startCheckpoint,
  type CheckpointAnswer,
} from '@/api/checkpoint'
import { ApiError, errorMessage } from '@/api/errors'
import { meKeys } from '@/api/me'
import type { Checkpoint, CheckpointAnswerResult, CheckpointStatus, SardorLine } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { MathText } from '@/components/math-text'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { AnswerPanel } from './answer-panel'
import {
  Heard,
  IdeaLists,
  Judging,
  NotYetView,
  PassedView,
  TeacherNotified,
} from './checkpoint-results'
import { SardorAvatar, SardorCard } from './sardor-card'

/** Uzbek message for answer errors: size, length and format first, then the usual ones. */
function answerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const server = error.serverMessage?.toLowerCase() ?? ''
    if (error.status === 413) return t.checkpoint.tooBig
    if (error.status === 400 && (server.includes('uzun') || server.includes('90')))
      return t.checkpoint.tooLong
    if (error.status === 400 && (server.includes('unsupported') || server.includes('could not')))
      return t.checkpoint.unreadable
  }
  return errorMessage(error)
}

const isAlreadyJudged = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 409 &&
  /judged|answered/i.test(error.serverMessage ?? '')

/** The line Sardor is waiting on: the follow-up when one is pending, else the opening. */
const currentLine = (cp: Checkpoint): SardorLine =>
  cp.stage === 'follow_up' && cp.followUp ? cp.followUp : cp.prompt

export function CheckpointPage() {
  const topicId = Number(useParams().topicId)
  const queryClient = useQueryClient()

  const status = useQuery({
    queryKey: checkpointKeys.status(topicId),
    queryFn: ({ signal }) => fetchCheckpointStatus(topicId, signal),
  })

  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null)
  const [line, setLine] = useState<SardorLine | null>(null)
  /** The first answer of a try, shown while Sardor asks his follow-up. */
  const [firstAnswer, setFirstAnswer] = useState<CheckpointAnswerResult | null>(null)
  const [result, setResult] = useState<CheckpointAnswerResult | null>(null)
  const [lastAnswer, setLastAnswer] = useState<CheckpointAnswer | null>(null)
  const [panelKey, setPanelKey] = useState(0)

  function openTry(cp: Checkpoint) {
    setCheckpoint(cp)
    setLine(currentLine(cp))
    setFirstAnswer(null)
    setResult(null)
    setLastAnswer(null)
    setPanelKey((k) => k + 1)
  }

  const start = useMutation({
    mutationFn: () => startCheckpoint(topicId),
    onSuccess: openTry,
  })

  const answer = useMutation({
    mutationFn: (payload: CheckpointAnswer) => {
      if (!checkpoint) throw new Error('no open try')
      return answerCheckpoint(checkpoint.checkpointId, payload)
    },
    onMutate: (payload) => setLastAnswer(payload),
    onSuccess: (res) => {
      if (res.outcome === 'follow_up' && res.followUp) {
        setFirstAnswer(res)
        setLine(res.followUp)
        setLastAnswer(null)
        setPanelKey((k) => k + 1)
        return
      }
      setResult(res)
      void queryClient.invalidateQueries({ queryKey: meKeys.all })
      void queryClient.invalidateQueries({ queryKey: checkpointKeys.status(topicId) })
    },
    onError: (error) => {
      // Someone (another tab) answered this try: pick up the current one.
      if (isAlreadyJudged(error)) start.mutate()
    },
  })

  function retryTry() {
    if (result?.next) openTry(result.next)
    else start.mutate()
  }

  const title = status.data?.topicTitle ?? checkpoint?.topicTitle
  const phase = result
    ? result.outcome
    : !checkpoint
      ? start.isPending
        ? 'starting'
        : 'intro'
      : answer.isPending
        ? 'judging'
        : firstAnswer
          ? 'follow_up'
          : 'answering'

  return (
    <div className="flex flex-1 flex-col" data-phase={phase}>
      <PageHeader
        title={t.checkpoint.title}
        subtitle={title}
        backTo={paths.topic(topicId)}
        backIcon="close"
      />

      {result?.outcome === 'passed' ? (
        <PassedView result={result} />
      ) : result?.outcome === 'not_yet' ? (
        <NotYetView
          result={result}
          topicId={topicId}
          onRetry={retryTry}
          retrying={start.isPending}
        />
      ) : checkpoint && line ? (
        <div className="flex flex-col gap-5">
          {firstAnswer && <Heard result={firstAnswer} />}
          <SardorCard key={line.text} line={line} />

          {answer.isPending && <Judging voice={lastAnswer?.kind === 'voice'} />}
          {answer.isError && !isAlreadyJudged(answer.error) && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger-soft/60 p-4"
            >
              <p className="flex items-start gap-2 text-sm text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {answerErrorMessage(answer.error)}
              </p>
              {lastAnswer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => answer.mutate(lastAnswer)}
                >
                  <RotateCcw aria-hidden />
                  {t.checkpoint.resend}
                </Button>
              )}
            </div>
          )}
          {/* Stays mounted while judging and after errors, so the recording is never lost. */}
          <div hidden={answer.isPending}>
            <AnswerPanel
              key={panelKey}
              onSubmit={(a) => answer.mutate(a)}
              submitting={answer.isPending}
            />
          </div>
        </div>
      ) : (
        <Intro
          status={status.data}
          loading={status.isPending}
          error={status.isError ? status.error : null}
          onReload={() => void status.refetch()}
          onStart={() => start.mutate()}
          starting={start.isPending}
          startError={start.isError ? start.error : null}
        />
      )}
    </div>
  )
}

type IntroProps = {
  status: CheckpointStatus | undefined
  loading: boolean
  error: unknown
  onReload: () => void
  onStart: () => void
  starting: boolean
  startError: unknown
}

function Intro({ status, loading, error, onReload, onStart, starting, startError }: IntroProps) {
  if (starting) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center" role="status">
        <SardorAvatar className="size-20 animate-pulse text-4xl motion-reduce:animate-none" />
        <p className="text-lg font-semibold">{t.checkpoint.thinking}</p>
      </div>
    )
  }

  const hasLast = Boolean(
    status?.lastResult &&
    (status.lastFeedback || status.lastMissingIdeas?.length || status.lastMatchedIdeas?.length),
  )

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start gap-3">
        <SardorAvatar />
        <div className="rounded-2xl rounded-tl-md border bg-card p-4 shadow-card">
          <p className="text-lg leading-snug font-semibold">{t.checkpoint.intro}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.checkpoint.introHow}</p>
        </div>
      </div>

      {loading ? (
        <SkeletonCard lines={1} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={onReload} />
      ) : (
        status && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{t.checkpoint.tries(status.tries)}</Chip>
              {status.lastResult && (
                <Chip tone={status.lastResult === 'passed' ? 'success' : 'warning'}>
                  {t.checkpoint.lastTry}:{' '}
                  {status.lastResult === 'passed'
                    ? t.checkpoint.lastPassed
                    : t.checkpoint.lastNotYet}
                </Chip>
              )}
            </div>
            {status.mastered && (
              <p className="text-sm text-muted-foreground">{t.checkpoint.alreadyMastered}</p>
            )}
            {hasLast && (
              <div className="rounded-xl border bg-card p-4 shadow-card">
                <p className="mb-2 text-sm font-semibold">{t.checkpoint.lastTry}</p>
                {status.lastFeedback && (
                  <MathText text={status.lastFeedback} className="mb-3 block leading-relaxed" />
                )}
                <IdeaLists
                  matched={status.lastMatchedIdeas ?? []}
                  missing={status.lastMissingIdeas ?? []}
                />
              </div>
            )}
            {status.needsHelp && <TeacherNotified />}
          </div>
        )
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4">
        {startError !== null && <ErrorState message={errorMessage(startError)} onRetry={onStart} />}
        {startError === null && (
          <Button size="lg" block onClick={onStart} disabled={loading}>
            {status?.openCheckpointId ? t.checkpoint.resume : t.checkpoint.start}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}
