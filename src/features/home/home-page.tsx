import { useToday } from '@/api/me'
import { useStudent } from '@/features/auth/auth-context'
import { t } from '@/lib/strings.uz'
import { weekdayDate } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

import { NotificationBell } from '@/components/notification-bell'

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
  useDocumentTitle(t.nav.home)

  const subtitle = today.data
    ? [weekdayDate(today.data.date), today.data.class?.name].filter(Boolean).join(' · ')
    : null

  return (
    <>
      <header className="mb-5 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-tight font-bold">{t.home.greeting(user.firstName)}</h1>
          <p className="mt-1 min-h-6 text-muted-foreground">{subtitle}</p>
        </div>
        <NotificationBell className="-mr-2" />
      </header>

      <TodayTaskCard />
      <CheckpointCard />
      <SchoolShortcuts />
      <LessonsSection />
      <DeadlinesSection />
      <WeakTopicsSection />
      <MasterySummary />
    </>
  )
}
