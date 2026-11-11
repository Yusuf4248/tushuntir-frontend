import { CircleCheck, Clock3, Radio, type LucideIcon } from 'lucide-react'

import type { LessonStatus } from '@/api/types'
import { Chip, type ChipTone } from '@/components/ui/chip'
import { t } from '@/lib/strings.uz'

const config: Record<LessonStatus, { icon: LucideIcon; tone: ChipTone }> = {
  upcoming: { icon: Clock3, tone: 'neutral' },
  in_progress: { icon: Radio, tone: 'info' },
  finished: { icon: CircleCheck, tone: 'success' },
}

export function LessonStatusChip({ status }: { status: LessonStatus }) {
  const { icon, tone } = config[status]
  return (
    <Chip tone={tone} icon={icon}>
      {t.lessonStatus[status]}
    </Chip>
  )
}
