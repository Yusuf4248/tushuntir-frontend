import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useAttendance } from '@/api/school'
import type { Attendance, AttendanceRecord, AttendanceStatus } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { t, tList } from '@/lib/i18n'
import { DEFAULT_TIMEZONE, dateInZone, dayMonth } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { attendanceStatus, statusOrder } from './attendance-status'

function shiftMonth(month: string, offset: number): string {
  const [y = 2026, m = 1] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + offset, 1))
  return d.toISOString().slice(0, 7)
}

function monthTitle(month: string): string {
  const [y, m = 1] = month.split('-').map(Number)
  return `${tList('attendance.monthsTitle')[m - 1] ?? ''} ${y}`
}

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const month = searchParams.get('month')
  const attendance = useAttendance(month)
  const [picked, setPicked] = useState<string | null>(null)

  const data = attendance.data
  const today = dateInZone(new Date(), DEFAULT_TIMEZONE)
  const thisMonth = today.slice(0, 7)

  function go(offset: number) {
    if (!data) return
    setPicked(null)
    setSearchParams({ month: shiftMonth(data.month, offset) }, { replace: true })
  }

  return (
    <>
      <PageHeader title={t('attendance.title')} backTo={paths.home} />

      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(-1)}
          aria-label={t('attendance.prevMonth')}
          disabled={!data}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <p className="min-w-0 flex-1 text-center font-semibold" aria-live="polite">
          {data ? monthTitle(data.month) : ' '}
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(1)}
          aria-label={t('attendance.nextMonth')}
          disabled={!data || data.month >= thisMonth}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      {attendance.isPending ? (
        <div aria-hidden className="flex flex-col gap-4">
          <SkeletonCard lines={2} />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : attendance.isError ? (
        <ErrorState
          message={errorMessage(attendance.error)}
          onRetry={() => void attendance.refetch()}
          retrying={attendance.isFetching}
        />
      ) : (
        <AttendanceView data={attendance.data} today={today} picked={picked} onPick={setPicked} />
      )}
    </>
  )
}

function AttendanceView({
  data,
  today,
  picked,
  onPick,
}: {
  data: Attendance
  today: string
  picked: string | null
  onPick: (date: string | null) => void
}) {
  const byDate = new Map<string, AttendanceRecord[]>()
  for (const r of data.records) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r])
  const misses = data.records.filter((r) => r.status !== 'present')
  const { summary } = data

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex items-center gap-4">
        <div className="shrink-0 text-center">
          <p className="text-4xl leading-none font-bold tabular-nums">
            {summary.percent == null ? '—' : `${Math.round(summary.percent)}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('attendance.percent')}</p>
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {statusOrder.map((status) => {
            const { icon: Icon, label, tone } = attendanceStatus[status]
            return (
              <li key={status} className="flex items-center gap-1.5">
                <Icon className={cn('size-4', toneText[tone])} aria-hidden />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold tabular-nums">{summary[status]}</span>
              </li>
            )
          })}
        </ul>
      </Card>
      {summary.percent == null && (
        <p className="text-sm text-muted-foreground">{t('attendance.noPercent')}</p>
      )}

      <MonthGrid month={data.month} byDate={byDate} today={today} picked={picked} onPick={onPick} />

      <Legend />

      {picked && <DayRecords date={picked} records={byDate.get(picked) ?? []} />}

      <section aria-labelledby="misses-title">
        <h2 id="misses-title" className="mb-3 text-lg font-semibold">
          {t('attendance.misses')}
        </h2>
        {misses.length === 0 ? (
          <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
            {t('attendance.noMisses')}
          </p>
        ) : (
          <RecordList records={[...misses].reverse()} showDate />
        )}
      </section>
    </div>
  )
}

const toneText: Record<string, string> = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  neutral: 'text-muted-foreground',
  primary: 'text-primary',
}

function MonthGrid({
  month,
  byDate,
  today,
  picked,
  onPick,
}: {
  month: string
  byDate: Map<string, AttendanceRecord[]>
  today: string
  picked: string | null
  onPick: (date: string | null) => void
}) {
  const [y = 2026, m = 1] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // Monday = 0
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ]

  return (
    <div className="rounded-xl border bg-card p-3 shadow-card">
      <div
        className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground"
        aria-hidden
      >
        {tList('attendance.weekdaysMonFirst').map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />
          const records = byDate.get(date) ?? []
          const statuses = statusOrder.filter((s) => records.some((r) => r.status === s))
          const day = Number(date.slice(8))
          const label = `${dayMonth(date)}${
            statuses.length
              ? `: ${statuses.map((s) => `${attendanceStatus[s].label} ${records.filter((r) => r.status === s).length}`).join(', ')}`
              : ''
          }`
          return (
            <button
              key={date}
              type="button"
              aria-label={label}
              aria-pressed={picked === date}
              disabled={records.length === 0}
              onClick={() => onPick(picked === date ? null : date)}
              className={cn(
                'flex aspect-square min-h-10 flex-col items-center justify-center gap-1 rounded-lg text-sm tabular-nums transition-colors',
                records.length ? 'cursor-pointer hover:bg-muted' : 'text-muted-foreground/60',
                date === today && 'ring-2 ring-primary',
                picked === date && 'bg-primary-soft',
              )}
            >
              <span className={cn(statuses[0] === 'absent' && 'font-semibold text-danger')}>
                {day}
              </span>
              <span className="flex h-1.5 gap-0.5" aria-hidden>
                {statuses.slice(0, 3).map((s) => (
                  <span key={s} className={cn('size-1.5 rounded-full', attendanceStatus[s].dot)} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <ul aria-label={t('attendance.legend')} className="flex flex-wrap gap-2">
      {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => {
        const { label, icon, tone, dot } = attendanceStatus[status]
        return (
          <li key={status}>
            <Chip tone={tone} icon={icon}>
              <span aria-hidden className={cn('size-2 rounded-full', dot)} />
              {label}
            </Chip>
          </li>
        )
      })}
    </ul>
  )
}

function DayRecords({ date, records }: { date: string; records: AttendanceRecord[] }) {
  return (
    <section aria-live="polite">
      <h2 className="mb-3 text-lg font-semibold">
        {t('attendance.dayTitle', { date: dayMonth(date) })}
      </h2>
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('attendance.noRecordsDay')}</p>
      ) : (
        <RecordList records={records} />
      )}
    </section>
  )
}

function RecordList({ records, showDate }: { records: AttendanceRecord[]; showDate?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
      {records.map((r) => {
        const { label, icon, tone } = attendanceStatus[r.status]
        return (
          <li
            key={`${r.lessonId}-${r.date}`}
            className="flex items-start gap-3 border-b p-4 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.subject.name}</p>
              <p className="text-sm text-muted-foreground">
                {[
                  showDate && dayMonth(r.date),
                  r.period != null && t('attendance.period', { count: r.period }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {r.note && (
                <p className="mt-1 text-sm">
                  <span className="text-muted-foreground">{t('attendance.note')}: </span>
                  {r.note}
                </p>
              )}
            </div>
            <Chip tone={tone} icon={icon}>
              {label}
            </Chip>
          </li>
        )
      })}
    </ul>
  )
}
