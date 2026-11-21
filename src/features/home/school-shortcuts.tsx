import { Link } from 'react-router'

import { schoolItems } from '@/components/layout/nav-items'
import { t } from '@/lib/i18n'

import { SchoolSummary } from './school-summary'
import { Section } from './section'

/** "Maktab": timetable, attendance, grades and homework, reachable from Home. */
export function SchoolShortcuts() {
  return (
    <Section title={t('school.title')} className="lg:mt-0">
      <ul className="grid grid-cols-4 gap-2">
        {schoolItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border bg-card px-1 py-2.5 text-center shadow-card transition-colors hover:bg-muted"
            >
              <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-xs leading-tight font-medium text-balance">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <SchoolSummary />
    </Section>
  )
}
