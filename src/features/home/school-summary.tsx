import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useAttendance, useGrades, useHomeworkList } from '@/api/school'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'
import { DEFAULT_TIMEZONE, dateInZone } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

/** Three small cards: homework due today, the latest grade, this month's attendance. */
export function SchoolSummary() {
  const homework = useHomeworkList()
  const grades = useGrades(null)
  const attendance = useAttendance(null)
  const today = dateInZone(new Date(), DEFAULT_TIMEZONE)

  const dueToday = (homework.data ?? []).filter(
    (h) => h.status === 'new' && h.dueAt && dateInZone(h.dueAt, DEFAULT_TIMEZONE) === today,
  )
  const latest = grades.data?.grades[0]
  const percent = attendance.data?.summary.percent

  return (
    <ul className="mt-3 grid grid-cols-3 gap-2">
      <SummaryCard
        to={
          dueToday.length === 1 && dueToday[0]
            ? paths.homeworkItem(dueToday[0].id)
            : `${paths.homework}?status=new`
        }
        label={t('home.dueToday')}
        loading={homework.isPending}
        value={dueToday.length ? t('home.dueCount', { count: dueToday.length }) : '0'}
        sub={dueToday[0]?.title ?? t('home.dueTodayNone')}
        tone={dueToday.length ? 'text-warning' : undefined}
      />
      <SummaryCard
        to={latest ? `${paths.grades}?subject=${latest.subject.id}` : paths.grades}
        label={t('home.latestGrade')}
        loading={grades.isPending}
        value={latest?.value != null ? String(latest.value) : '—'}
        sub={latest?.subject.name ?? t('home.noGrade')}
      />
      <SummaryCard
        to={paths.attendance}
        label={t('home.attendance')}
        loading={attendance.isPending}
        value={percent == null ? '—' : `${Math.round(percent)}%`}
        sub={t('home.attendanceMonth')}
      />
    </ul>
  )
}

function SummaryCard({
  to,
  label,
  value,
  sub,
  loading,
  tone,
}: {
  to: string
  label: string
  value: ReactNode
  sub: string
  loading: boolean
  tone?: string
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex h-full min-h-24 flex-col rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-muted"
      >
        <span className="text-xs leading-tight text-muted-foreground">{label}</span>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-12" />
        ) : (
          <span
            className={cn(
              'mt-1 font-display text-xl leading-tight font-semibold tabular-nums',
              tone,
            )}
          >
            {value}
          </span>
        )}
        <span className="mt-auto line-clamp-2 pt-1 text-xs leading-snug text-muted-foreground">
          {sub}
        </span>
      </Link>
    </li>
  )
}
