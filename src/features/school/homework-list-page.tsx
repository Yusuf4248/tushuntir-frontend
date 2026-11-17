import { ChevronRight, ClipboardPen, Paperclip } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useHomeworkList } from '@/api/school'
import type { HomeworkItem, HomeworkStatus } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { DEFAULT_TIMEZONE, dateInZone, relativeDayTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { HomeworkStatusChip } from './homework-status'
import { homeworkStatuses } from './homework-statuses'

export function HomeworkListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('status') as HomeworkStatus | null
  const list = useHomeworkList()
  const items = list.data ?? []
  const shown = filter ? items.filter((h) => h.status === filter) : items
  const today = dateInZone(new Date(), DEFAULT_TIMEZONE)

  return (
    <>
      <PageHeader title={t.homework.title} backTo={paths.home} />

      <div
        role="radiogroup"
        aria-label={t.homework.filters}
        className="-mx-4 mb-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1"
      >
        {[null, ...homeworkStatuses].map((status) => {
          const count = status ? items.filter((h) => h.status === status).length : items.length
          if (status && count === 0 && filter !== status) return null
          const active = filter === status
          return (
            <button
              key={status ?? 'all'}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSearchParams(status ? { status } : {}, { replace: true })}
              className={cn(
                'flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-muted',
              )}
            >
              {status ? t.homework.status[status] : t.homework.all}
              <span className={cn('tabular-nums', active ? 'opacity-85' : 'text-muted-foreground')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {list.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : list.isError ? (
        <ErrorState
          message={errorMessage(list.error)}
          onRetry={() => void list.refetch()}
          retrying={list.isFetching}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={ClipboardPen}
          title={filter ? t.homework.emptyFiltered : t.homework.empty}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((item) => (
            <li key={item.id}>
              <HomeworkRow item={item} today={today} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function HomeworkRow({ item, today }: { item: HomeworkItem; today: string }) {
  return (
    <Link
      to={paths.homeworkItem(item.id)}
      className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{item.subject.name}</p>
        <p className="mt-0.5 font-semibold">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.dueAt
            ? t.homework.due(relativeDayTime(item.dueAt, today, DEFAULT_TIMEZONE))
            : t.homework.noDue}
          {item.hasAttachments && (
            <Paperclip
              className="ml-2 inline size-3.5 align-[-2px]"
              aria-label={t.homework.hasFiles}
            />
          )}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <HomeworkStatusChip status={item.status} />
          {item.score != null && (
            <span className="text-sm font-semibold tabular-nums">
              {t.homework.score(item.score)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
