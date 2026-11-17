import type { HomeworkStatus } from '@/api/types'

/** Filter order on the homework list. */
export const homeworkStatuses: HomeworkStatus[] = [
  'new',
  'overdue',
  'submitted',
  'late',
  'checked',
  'returned',
]
