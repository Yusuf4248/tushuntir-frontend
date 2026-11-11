import {
  ChevronRight,
  ClipboardList,
  Dumbbell,
  LogOut,
  MessageCircleMore,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useRecentAttempts, useSubjects, useToday } from '@/api/me'
import type { AttemptHistoryItem } from '@/api/types'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useAuth, useStudent } from '@/features/auth/auth-context'
import { t } from '@/lib/strings.uz'
import { getTheme, setTheme, type ThemeChoice } from '@/lib/theme'
import { DEFAULT_TIMEZONE, clockInZone, dateInZone, dayMonth } from '@/lib/time'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

export function ProfilePage() {
  const user = useStudent()
  const { logout } = useAuth()
  const today = useToday()
  const [leaving, setLeaving] = useState(false)
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  const className = today.data?.class?.name

  return (
    <>
      <PageHeader title={t.profile.title} />

      <Card className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary-soft-foreground"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-muted-foreground">
            {[className && `${className} ${t.profile.className.toLowerCase()}`, user.school?.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {user.phone && <p className="text-sm text-muted-foreground tabular-nums">{user.phone}</p>}
        </div>
      </Card>

      <SubjectsSection />
      <RecentSection />

      <section className="mt-8" aria-labelledby="theme-title">
        <h2 id="theme-title" className="mb-3 text-lg font-semibold">
          {t.profile.theme}
        </h2>
        <ThemeSwitch />
      </section>

      <Button
        variant="destructive"
        block
        className="mt-8"
        loading={leaving}
        onClick={() => {
          setLeaving(true)
          void logout()
        }}
      >
        <LogOut aria-hidden />
        {t.auth.logout}
      </Button>
    </>
  )
}

function SubjectsSection() {
  const subjects = useSubjects()
  return (
    <section className="mt-8" aria-labelledby="subjects-title">
      <h2 id="subjects-title" className="mb-3 text-lg font-semibold">
        {t.profile.subjects}
      </h2>
      {subjects.isPending ? (
        <SkeletonCard lines={2} />
      ) : subjects.isError ? (
        <ErrorState
          message={errorMessage(subjects.error)}
          onRetry={() => void subjects.refetch()}
          retrying={subjects.isFetching}
        />
      ) : subjects.data.length === 0 ? (
        <EmptyState title={t.profile.noSubjects} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
          {subjects.data.map((subject) => (
            <li key={subject.id} className="border-b p-4 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{subject.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {subject.topicsTotal > 0
                    ? `${subject.topicsMastered}/${subject.topicsTotal}`
                    : ''}
                </p>
              </div>
              {subject.topicsTotal > 0 ? (
                <ProgressBar
                  className="mt-2"
                  value={subject.topicsMastered}
                  max={subject.topicsTotal}
                  label={subject.name}
                  valueText={t.profile.masteredOf(subject.topicsMastered, subject.topicsTotal)}
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t.profile.noTextbook}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const kindIcon: Record<AttemptHistoryItem['kind'], LucideIcon> = {
  lesson_quiz: ClipboardList,
  practice: Dumbbell,
  checkpoint: MessageCircleMore,
}

function attemptLink(item: AttemptHistoryItem): string {
  if (item.kind === 'checkpoint') return item.topic ? paths.checkpoint(item.topic.id) : paths.home
  return item.finishedAt ? paths.attemptResult(item.id) : paths.attempt(item.id)
}

function RecentSection() {
  const recent = useRecentAttempts(10)
  const today = useToday()
  const timeZone = today.data?.timezone ?? DEFAULT_TIMEZONE

  return (
    <section className="mt-8" aria-labelledby="recent-title">
      <h2 id="recent-title" className="mb-3 text-lg font-semibold">
        {t.profile.recent}
      </h2>
      {recent.isPending ? (
        <SkeletonCard lines={3} />
      ) : recent.isError ? (
        <ErrorState
          message={errorMessage(recent.error)}
          onRetry={() => void recent.refetch()}
          retrying={recent.isFetching}
        />
      ) : recent.data.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t.profile.noRecent}
          description={t.profile.noRecentHint}
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
          {recent.data.map((item) => {
            const Icon = kindIcon[item.kind]
            const when = item.finishedAt ?? item.startedAt
            return (
              <li key={`${item.kind}-${item.id}`} className="border-b last:border-b-0">
                <Link
                  to={attemptLink(item)}
                  className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t.profile[`kind_${item.kind}`]}
                      {when &&
                        ` · ${dayMonth(dateInZone(when, timeZone))}, ${clockInZone(when, timeZone)}`}
                    </p>
                    <p className="font-medium">{item.topic?.title ?? ''}</p>
                    <ResultBadge item={item} />
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ResultBadge({ item }: { item: AttemptHistoryItem }) {
  if (item.kind === 'checkpoint') {
    if (item.result === 'passed')
      return (
        <Chip tone="success" className="mt-1.5">
          {t.profile.passed}
        </Chip>
      )
    if (item.result === 'not_yet')
      return (
        <Chip tone="warning" className="mt-1.5">
          {t.profile.notYet}
        </Chip>
      )
    return <Chip className="mt-1.5">{t.profile.inProgress}</Chip>
  }
  if (item.scorePercent === null) return <Chip className="mt-1.5">{t.profile.inProgress}</Chip>
  return (
    <Chip tone={item.scorePercent >= 80 ? 'success' : 'warning'} className="mt-1.5 tabular-nums">
      {item.scorePercent}%
    </Chip>
  )
}

const themes: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: t.profile.themeLight, icon: Sun },
  { value: 'dark', label: t.profile.themeDark, icon: Moon },
  { value: 'system', label: t.profile.themeSystem, icon: Monitor },
]

function ThemeSwitch() {
  const [choice, setChoice] = useState<ThemeChoice>(getTheme)
  return (
    <div
      role="radiogroup"
      aria-label={t.profile.theme}
      className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1"
    >
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          onClick={() => {
            setChoice(value)
            setTheme(value)
          }}
          className={cn(
            'flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
            choice === value
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
