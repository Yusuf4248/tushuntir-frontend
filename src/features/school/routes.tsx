/** The school screens, loaded together as one chunk. */
export { AttendancePage } from './attendance-page'
export { TimetablePage } from './timetable-page'
import { t } from '@/lib/strings.uz'

import { SchoolPlaceholder } from './placeholder-page'

export function GradesPage() {
  return <SchoolPlaceholder title={t.school.grades} />
}
export function HomeworkListPage() {
  return <SchoolPlaceholder title={t.school.homework} />
}
export function HomeworkPage() {
  return <SchoolPlaceholder title={t.school.homework} />
}
export function NotificationsPage() {
  return <SchoolPlaceholder title={t.school.notifications} />
}
