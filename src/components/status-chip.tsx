import {
  CircleDashed,
  CircleDot,
  LifeBuoy,
  Lock,
  RotateCcw,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import type { MasteryStatus } from '@/api/types'
import { Chip, type ChipTone } from '@/components/ui/chip'
import { t } from '@/lib/strings.uz'

export type ChipStatus = MasteryStatus | 'locked'

const config: Record<ChipStatus, { icon: LucideIcon; tone: ChipTone }> = {
  not_started: { icon: CircleDashed, tone: 'neutral' },
  in_progress: { icon: CircleDot, tone: 'info' },
  needs_practice: { icon: RotateCcw, tone: 'warning' },
  needs_help: { icon: LifeBuoy, tone: 'danger' },
  mastered: { icon: Trophy, tone: 'success' },
  locked: { icon: Lock, tone: 'neutral' },
}

export function StatusChip({ status, className }: { status: ChipStatus; className?: string }) {
  const { icon, tone } = config[status]
  return (
    <Chip tone={tone} icon={icon} className={className}>
      {t.status[status]}
    </Chip>
  )
}
