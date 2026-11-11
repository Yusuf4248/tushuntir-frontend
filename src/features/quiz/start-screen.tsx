import { ArrowRight, CircleHelp, Clock, ListChecks } from 'lucide-react'
import type { ReactNode } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { t } from '@/lib/strings.uz'
import { URGENT_MS, timeLeft, useNow } from '@/lib/time'

type StartScreenProps = {
  eyebrow: string
  title: string
  subject: string
  questionCount: number
  dueAt?: string | null
  dueLabel?: string | null
  note: string
  actionLabel: string
  onStart: () => void
  starting: boolean
  /** Shown above the button with a retry action. */
  error?: string | null
  secondaryAction?: ReactNode
  backTo: string
}

export function StartScreen({
  eyebrow,
  title,
  subject,
  questionCount,
  dueAt,
  dueLabel,
  note,
  actionLabel,
  onStart,
  starting,
  error,
  secondaryAction,
  backTo,
}: StartScreenProps) {
  const now = useNow()
  const msLeft = dueAt ? Date.parse(dueAt) - now : null

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={eyebrow} backTo={backTo} backIcon="close" />

      <div className="flex-1">
        <p className="text-muted-foreground">{subject}</p>
        <h2 className="mt-1 text-2xl leading-tight font-bold text-balance">{title}</h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip icon={ListChecks}>{t.quiz.questionCount(questionCount)}</Chip>
          {msLeft !== null && (
            <Chip tone={msLeft < URGENT_MS ? 'warning' : 'neutral'} icon={Clock}>
              {timeLeft(msLeft)}
            </Chip>
          )}
        </div>
        {dueLabel && <p className="mt-2 text-sm text-muted-foreground">{dueLabel}</p>}

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden />
          {note}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {error && <ErrorState message={error} onRetry={onStart} retrying={starting} />}
        {!error && (
          <Button size="lg" block onClick={onStart} loading={starting}>
            {starting ? t.quiz.starting : actionLabel}
            {!starting && <ArrowRight aria-hidden />}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  )
}
