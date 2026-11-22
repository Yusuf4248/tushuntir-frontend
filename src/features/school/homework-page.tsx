import { useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Lock, MessageSquareText, RotateCcw, SearchX, UserRound } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useParams } from 'react-router'

import { ApiError, errorMessage } from '@/api/errors'
import { schoolKeys, useHomework } from '@/api/school'
import type { HomeworkDetail } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'
import { DEFAULT_TIMEZONE, dateInZone, dayMonth, relativeDayTime } from '@/lib/time'
import { paths } from '@/routes/paths'

import { FileTile } from './file-tile'
import { HomeworkStatusChip } from './homework-status'
import { SubmissionForm } from './submission-form'

export function HomeworkPage() {
  const id = Number(useParams().homeworkId)
  const homework = useHomework(id)

  if (homework.isPending) {
    return (
      <>
        <PageHeader title={t('homework.title')} backTo={paths.homework} />
        <SkeletonCard lines={4} />
      </>
    )
  }
  if (homework.isError) {
    const notFound = homework.error instanceof ApiError && homework.error.status === 404
    return (
      <>
        <PageHeader title={t('homework.title')} backTo={paths.homework} />
        {notFound ? (
          <EmptyState icon={SearchX} title={t('homework.empty')} />
        ) : (
          <ErrorState
            message={errorMessage(homework.error)}
            onRetry={() => void homework.refetch()}
            retrying={homework.isFetching}
          />
        )}
      </>
    )
  }
  return <HomeworkView homework={homework.data} />
}

function HomeworkView({ homework }: { homework: HomeworkDetail }) {
  const queryClient = useQueryClient()
  const today = dateInZone(new Date(), DEFAULT_TIMEZONE)
  const sub = homework.submission
  const locked = sub?.status === 'checked'

  // A signed file link expired (403): fetch the homework again for fresh links, once a minute at most.
  const lastRefresh = useRef(0)
  const refreshLinks = useCallback(() => {
    if (Date.now() - lastRefresh.current < 60_000) return
    lastRefresh.current = Date.now()
    void queryClient.invalidateQueries({ queryKey: schoolKeys.homework(homework.id) })
  }, [queryClient, homework.id])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <PageHeader
          title={homework.title}
          display={false}
          subtitle={homework.subject.name}
          backTo={paths.homework}
          className="mb-3"
        />
        <div className="flex flex-wrap items-center gap-2">
          <HomeworkStatusChip status={homework.status} />
          {homework.score != null && (
            <span className="font-semibold tabular-nums">
              {t('homework.score', { count: homework.score })}
            </span>
          )}
        </div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0" aria-hidden />
            {homework.dueAt
              ? t('homework.due', {
                  when: relativeDayTime(homework.dueAt, today, DEFAULT_TIMEZONE),
                })
              : t('homework.noDue')}
            <span aria-hidden>·</span>
            {t('homework.lessonDate', { date: dayMonth(homework.lessonDate) })}
          </li>
          {homework.teacher && (
            <li className="flex items-center gap-2">
              <UserRound className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">{t('homework.teacher')}: </span>
              {homework.teacher.firstName} {homework.teacher.lastName}
            </li>
          )}
        </ul>
      </div>

      {homework.description && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            {t('homework.description')}
          </h2>
          <p className="leading-relaxed whitespace-pre-wrap">{homework.description}</p>
        </Card>
      )}

      {homework.attachments.length > 0 && (
        <section aria-labelledby="teacher-files">
          <h2 id="teacher-files" className="mb-2 text-lg font-semibold">
            {t('homework.teacherFiles')}
          </h2>
          <ul className="flex flex-col gap-2">
            {homework.attachments.map((f) => (
              <li key={f.id}>
                <FileTile file={f} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sub && (
        <section aria-labelledby="my-answer" className="flex flex-col gap-3">
          <h2 id="my-answer" className="text-lg font-semibold">
            {t('homework.mySubmission')}
          </h2>
          {(sub.feedback || sub.score != null) && (
            <div className="rounded-xl border border-success/30 bg-success-soft/60 p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-success">
                <MessageSquareText className="size-4" aria-hidden />
                {t('homework.feedback')}
                {sub.score != null && (
                  <span className="ml-auto tabular-nums">
                    {t('homework.score', { count: sub.score })}
                  </span>
                )}
              </p>
              {sub.feedback && <p className="leading-relaxed">{sub.feedback}</p>}
            </div>
          )}
          <Card>
            {sub.submittedAt && (
              <p className="mb-2 text-sm text-muted-foreground">
                {t('homework.submittedAt', {
                  when: relativeDayTime(sub.submittedAt, today, DEFAULT_TIMEZONE),
                })}
              </p>
            )}
            {sub.text && <p className="leading-relaxed whitespace-pre-wrap">{sub.text}</p>}
            {sub.files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {sub.files.map((f) => (
                  <li key={f.id}>
                    <FileTile file={f} onExpired={refreshLinks} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}

      {locked ? (
        <p className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {t('homework.checkedNote')}
        </p>
      ) : (
        <>
          {sub?.status === 'returned' && (
            <p className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
              <RotateCcw className="size-4 shrink-0" aria-hidden />
              {t('homework.returnedNote')}
            </p>
          )}
          <SubmissionForm key={sub?.id ?? 'new'} homework={homework} />
        </>
      )}
    </div>
  )
}
