/** The school screens, loaded together as one chunk. */
import { t } from '@/lib/strings.uz'

import { SchoolPlaceholder } from './placeholder-page'

export function TimetablePage() {
  return <SchoolPlaceholder title={t.school.timetable} />
}
export function AttendancePage() {
  return <SchoolPlaceholder title={t.school.attendance} />
}
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
