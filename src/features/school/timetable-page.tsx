import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardPen,
  MapPin,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useQuizzes } from '@/api/me'
import { useHomeworkList, useTimetable } from '@/api/school'
import type { TimetableDay, TimetableLesson } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { LessonStatusChip } from '@/features/home/lesson-status-chip'
import { t, tList } from '@/lib/i18n'
import { DEFAULT_TIMEZONE, addDays, dateInZone, dayMonth, parseDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

export function TimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const week = searchParams.get('week')
  const timetable = useTimetable(week)
  const [picked, setPicked] = useState<string | null>(null)

  const data = timetable.data
  const timeZone = data?.timezone ?? DEFAULT_TIMEZONE
  const today = dateInZone(new Date(), timeZone)
  const days = data?.days ?? []
  // Today when it is in this week, else Monday, unless the student picked a day.
  const selected =
    days.find((d) => d.date === picked) ?? days.find((d) => d.date === today) ?? days[0]
  const isThisWeek = data ? today >= data.weekStart && today <= data.weekEnd : true

  function goWeek(offset: number) {
    if (!data) return
    setPicked(null)
    setSearchParams({ week: addDays(data.weekStart, offset * 7) }, { replace: true })
  }

  return (
    <>
      <PageHeader title={t('timetable.title')} subtitle={data?.class?.name} backTo={paths.home} />

      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goWeek(-1)}
          aria-label={t('timetable.prevWeek')}
          disabled={!data}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <p className="min-w-0 flex-1 text-center font-semibold" aria-live="polite">
          {data
            ? t('timetable.weekRange', {
                from: dayMonth(data.weekStart),
                to: dayMonth(data.weekEnd),
              })
            : ' '}
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => goWeek(1)}
          aria-label={t('timetable.nextWeek')}
          disabled={!data}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {!isThisWeek && (
        <div className="mb-3 text-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setPicked(null)
              setSearchParams({}, { replace: true })
            }}
          >
            {t('timetable.thisWeek')}
          </Button>
        </div>
      )}

      {timetable.isPending ? (
        <div aria-hidden>
          <Skeleton className="mb-4 h-16 w-full rounded-xl" />
          <SkeletonCard lines={3} />
        </div>
      ) : timetable.isError ? (
        <ErrorState
          message={errorMessage(timetable.error)}
          onRetry={() => void timetable.refetch()}
          retrying={timetable.isFetching}
        />
      ) : (
        <>
          <DayTabs days={days} selected={selected?.date} today={today} onSelect={setPicked} />
          {selected && <DayLessons day={selected} />}
        </>
      )}
    </>
  )
}

function DayTabs({
  days,
  selected,
  today,
  onSelect,
}: {
  days: TimetableDay[]
  selected?: string
  today: string
  onSelect: (date: string) => void
}) {
  return (
    <div role="tablist" aria-label={t('timetable.days')} className="mb-4 grid grid-cols-6 gap-1.5">
      {days.map((day) => {
        const active = day.date === selected
        const isToday = day.date === today
        const { d } = parseDate(day.date)
        return (
          <button
            key={day.date}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${tList('timetable.weekdaysShort')[day.weekday % 7]}, ${dayMonth(day.date)}${isToday ? `, ${t('timetable.today')}` : ''}`}
            onClick={() => onSelect(day.date)}
            className={cn(
              'relative flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted',
              isToday && !active && 'border-primary text-primary',
            )}
          >
            <span className="font-semibold">
              {tList('timetable.weekdaysShort')[day.weekday % 7]}
            </span>
            <span className={cn('tabular-nums', active ? 'opacity-90' : 'text-muted-foreground')}>
              {d}
            </span>
            {day.lessons.length > 0 && !active && (
              <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-primary/60" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function DayLessons({ day }: { day: TimetableDay }) {
  // Fallback for backends without quizId / homeworkId on lessons: find them by lesson.
  const needsLookup = day.lessons.some(
    (l) => (l.hasQuiz && l.quizId == null) || (l.hasHomework && l.homeworkId == null),
  )
  const quizzes = useQuizzes()
  const homework = useHomeworkList()
  const quizFor = (l: TimetableLesson) => {
    if (l.quizId != null) return l.quizId
    if (!needsLookup || !quizzes.data) return null
    const all = [...quizzes.data.available, ...quizzes.data.done, ...quizzes.data.overdue]
    return all.find((q) => q.lessonId === l.lessonId)?.quizId ?? null
  }
  const homeworkFor = (l: TimetableLesson) =>
    l.homeworkId ??
    (needsLookup ? (homework.data?.find((h) => h.lessonId === l.lessonId)?.id ?? null) : null)

  if (day.lessons.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title={t('timetable.noLessons')}
        description={t('timetable.noLessonsHint')}
      />
    )
  }

  return (
    <ol className="flex flex-col gap-3" aria-label={dayMonth(day.date)}>
      {day.lessons.map((lesson, i) => {
        const quizId = lesson.hasQuiz ? quizFor(lesson) : null
        const homeworkId = lesson.hasHomework ? homeworkFor(lesson) : null
        return (
          <li
            key={lesson.lessonId ?? `slot-${i}`}
            className={cn(
              'flex gap-4 rounded-xl border bg-card p-4 shadow-card',
              lesson.status === 'in_progress' && 'border-info/40 bg-info-soft/40',
            )}
          >
            <div className="w-12 shrink-0 text-sm leading-tight tabular-nums">
              {lesson.period != null && (
                <p className="mb-1 text-xs text-muted-foreground">
                  {t('timetable.period', { count: lesson.period })}
                </p>
              )}
              <p className="font-semibold">{lesson.startsAt ?? '—'}</p>
              <p className="text-muted-foreground">{lesson.endsAt ?? ''}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                <p className="font-semibold">{lesson.subject.name}</p>
                {lesson.status && <LessonStatusChip status={lesson.status} />}
              </div>
              {lesson.topic ? (
                <Link
                  to={paths.topic(lesson.topic.id)}
                  className="mt-0.5 block text-sm text-primary underline-offset-2 hover:underline"
                >
                  {lesson.topic.title}
                </Link>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">{t('timetable.noTopic')}</p>
              )}
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {lesson.teacher && (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5" aria-hidden />
                    <span className="sr-only">{t('timetable.teacher')}: </span>
                    {lesson.teacher.firstName} {lesson.teacher.lastName}
                  </span>
                )}
                {lesson.room && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    <span className="sr-only">{t('timetable.room')}: </span>
                    {lesson.room}
                  </span>
                )}
              </p>
              {(lesson.hasQuiz || lesson.hasHomework) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.hasQuiz && (
                    <Badge
                      to={quizId != null ? paths.quiz(quizId) : null}
                      icon={ClipboardList}
                      label={t('timetable.quiz')}
                    />
                  )}
                  {lesson.hasHomework && (
                    <Badge
                      to={homeworkId != null ? paths.homeworkItem(homeworkId) : null}
                      icon={ClipboardPen}
                      label={t('timetable.homework')}
                    />
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Badge({
  to,
  icon,
  label,
}: {
  to: string | null
  icon: typeof ClipboardList
  label: string
}) {
  if (!to) return <Chip icon={icon}>{label}</Chip>
  return (
    <Link to={to} className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
      <Chip tone="primary" icon={icon} className="min-h-9 hover:brightness-95">
        {label}
      </Chip>
    </Link>
  )
}
