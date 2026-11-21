import {
  AlarmClockOff,
  CircleCheck,
  CircleDot,
  Clock3,
  RotateCcw,
  Send,
  type LucideIcon,
} from 'lucide-react'

import type { HomeworkStatus } from '@/api/types'
import { Chip, type ChipTone } from '@/components/ui/chip'
import { tOptional } from '@/lib/i18n'

const config: Record<HomeworkStatus, { icon: LucideIcon; tone: ChipTone }> = {
  new: { icon: CircleDot, tone: 'info' },
  overdue: { icon: AlarmClockOff, tone: 'danger' },
  submitted: { icon: Send, tone: 'primary' },
  late: { icon: Clock3, tone: 'warning' },
  checked: { icon: CircleCheck, tone: 'success' },
  returned: { icon: RotateCcw, tone: 'warning' },
}

export function HomeworkStatusChip({ status }: { status: HomeworkStatus }) {
  const { icon, tone } = config[status]
  return (
    <Chip tone={tone} icon={icon}>
      {tOptional(`homework.status.${status}`) ?? status}
    </Chip>
  )
}
