import { useToday } from '@/api/me'
import { useStudent } from '@/features/auth/auth-context'
import { t } from '@/lib/i18n'
import { weekdayDate } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

import { NotificationBell } from '@/components/notification-bell'
import { ThemeToggle } from '@/components/theme-toggle'

import { CheckpointCard } from './checkpoint-card'
import { DeadlinesSection } from './deadlines-section'
import { LessonsSection } from './lessons-section'
import { MasterySummary } from './mastery-summary'
import { SchoolShortcuts } from './school-shortcuts'
import { TodayTaskCard } from './today-task-card'
import { WeakTopicsSection } from './weak-topics-section'

export function HomePage() {
  const user = useStudent()
  const today = useToday()
  useDocumentTitle(t('nav.home'))

  const subtitle = today.data
    ? [weekdayDate(today.data.date), today.data.class?.name].filter(Boolean).join(' · ')
    : null

  return (
    <>
      <header className="mb-5 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.625rem] leading-tight font-semibold tracking-tight break-words">
            {t('home.greeting', { name: user.firstName })}
          </h1>
          <p className="mt-1 min-h-6 text-muted-foreground">{subtitle}</p>
        </div>
        <div className="-mr-2 flex shrink-0 items-center">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      {/* Phone: one column. Desktop: the AI work on the left, school and progress on the right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-10">
        <div className="min-w-0">
          <TodayTaskCard />
          <CheckpointCard />
          <LessonsSection />
          <DeadlinesSection />
        </div>
        <div className="min-w-0 lg:sticky lg:top-8">
          <SchoolShortcuts />
          <WeakTopicsSection />
          <MasterySummary />
        </div>
      </div>
    </>
  )
}
