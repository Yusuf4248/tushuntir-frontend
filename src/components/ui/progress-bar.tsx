import { cn } from '@/lib/utils'

type ProgressBarProps = {
  value: number
  max?: number
  /** Read by screen readers, e.g. "O'zlashtirish". */
  label: string
  /** Visible text for the value, e.g. "3 / 12". */
  valueText?: string
  className?: string
}

export function ProgressBar({ value, max = 100, label, valueText, className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
