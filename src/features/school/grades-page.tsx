import { ChevronRight, MessageSquareText, Star } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useGrades } from '@/api/school'
import type { Grade, Grades } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { dayMonth } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const formatAverage = (n: number) =>
  new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n)

/** 5 and 4.5+ green, 3.5+ blue, lower amber; the number is always shown with it. */
function gradeTone(value: number | null): string {
  if (value == null) return 'bg-muted text-muted-foreground'
  if (value >= 4.5) return 'bg-success-soft text-success'
  if (value >= 3.5) return 'bg-info-soft text-info'
  return 'bg-warning-soft text-warning'
}

const kindLabel = (kind: string | null) =>
  (kind && t.grades.kinds[kind]) || kind || t.grades.otherKind

export function GradesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const termParam = Number(searchParams.get('term')) || null
  const subjectId = Number(searchParams.get('subject')) || null
  const grades = useGrades(termParam)

  function setParam(next: { term?: number | null; subject?: number | null }) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value == null) params.delete(key)
      else params.set(key, String(value))
    }
    setSearchParams(params)
  }

  const data = grades.data
  const subject = subjectId ? data?.averages.find((a) => a.subject.id === subjectId)?.subject : null

  return (
    <>
      <PageHeader
        title={subject ? t.grades.subjectGrades(subject.name) : t.grades.title}
        subtitle={data?.term?.name}
        backTo={subject ? `${paths.grades}${termParam ? `?term=${termParam}` : ''}` : paths.home}
      />

      {data && data.terms.length > 1 && !subject && (
        <div
          role="radiogroup"
          aria-label={t.grades.terms}
          className="-mx-4 mb-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4"
        >
          {data.terms.map((term) => {
            const active = term.id === data.term?.id
            return (
              <button
                key={term.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setParam({ term: term.id, subject: null })}
                className={cn(
                  'min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted',
                )}
              >
                {term.name}
              </button>
            )
          })}
        </div>
      )}

      {grades.isPending ? (
        <div className="grid grid-cols-2 gap-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
      ) : grades.isError ? (
        <ErrorState
          message={errorMessage(grades.error)}
          onRetry={() => void grades.refetch()}
          retrying={grades.isFetching}
        />
      ) : subject ? (
        <SubjectGrades grades={grades.data.grades.filter((g) => g.subject.id === subject.id)} />
      ) : (
        <Averages data={grades.data} onOpen={(id) => setParam({ subject: id })} />
      )}
    </>
  )
}

function Averages({ data, onOpen }: { data: Grades; onOpen: (subjectId: number) => void }) {
  if (data.averages.length === 0) return <EmptyState icon={Star} title={t.grades.noGrades} />
  return (
    <section aria-labelledby="averages-title">
      <h2 id="averages-title" className="mb-3 text-lg font-semibold">
        {t.grades.averages}
      </h2>
      <ul className="grid grid-cols-2 gap-3">
        {data.averages.map((a) => (
          <li key={a.subject.id}>
            <button
              type="button"
              onClick={() => onOpen(a.subject.id)}
              className="flex h-full w-full cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-card transition-colors hover:bg-muted"
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className="font-semibold">{a.subject.name}</span>
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </span>
              <span className="flex items-end justify-between gap-2">
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-2xl font-bold tabular-nums',
                    gradeTone(a.average),
                  )}
                >
                  <span className="sr-only">{t.grades.average}: </span>
                  {a.average == null ? '—' : formatAverage(a.average)}
                </span>
                <span className="text-xs text-muted-foreground">{t.grades.count(a.count)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SubjectGrades({ grades }: { grades: Grade[] }) {
  if (grades.length === 0) return <EmptyState icon={Star} title={t.grades.noGrades} />
  return (
    <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
      {grades.map((g) => (
        <li key={g.id} className="flex items-start gap-3 border-b p-4 last:border-b-0">
          <span
            className={cn(
              'grid size-12 shrink-0 place-items-center rounded-xl text-xl font-bold tabular-nums',
              gradeTone(g.value),
            )}
          >
            {g.value ?? '—'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{kindLabel(g.kind)}</p>
            <p className="text-sm text-muted-foreground">
              {dayMonth(g.date)}
              {g.teacher && ` · ${g.teacher.firstName} ${g.teacher.lastName}`}
            </p>
            {g.comment && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm">
                <MessageSquareText
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {g.comment}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
