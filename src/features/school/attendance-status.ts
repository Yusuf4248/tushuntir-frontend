import { CircleCheck, CircleX, Clock3, FileCheck, type LucideIcon } from 'lucide-react'

import type { AttendanceStatus } from '@/api/types'
import type { ChipTone } from '@/components/ui/chip'
import { t } from '@/lib/i18n'

export const attendanceStatus: Record<
  AttendanceStatus,
  { label: string; icon: LucideIcon; tone: ChipTone; dot: string }
> = {
  present: {
    get label() {
      return t('attendance.present')
    },
    icon: CircleCheck,
    tone: 'success',
    dot: 'bg-success',
  },
  absent: {
    get label() {
      return t('attendance.absent')
    },
    icon: CircleX,
    tone: 'danger',
    dot: 'bg-danger',
  },
  late: {
    get label() {
      return t('attendance.late')
    },
    icon: Clock3,
    tone: 'warning',
    dot: 'bg-warning',
  },
  excused: {
    get label() {
      return t('attendance.excused')
    },
    icon: FileCheck,
    tone: 'info',
    dot: 'bg-info',
  },
}

/** Most important first: a day with one absence shows the absence before the presences. */
export const statusOrder: AttendanceStatus[] = ['absent', 'late', 'excused', 'present']
