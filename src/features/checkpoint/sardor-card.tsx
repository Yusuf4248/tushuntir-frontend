import { absoluteAudioUrl } from '@/api/checkpoint'
import type { SardorLine } from '@/api/types'
import { MathText } from '@/components/math-text'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { AudioPlayer } from './audio-player'

/** Sardor: a friendly illustrated initial, no photo. */
export function SardorAvatar({ className, happy }: { className?: string; happy?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br text-2xl font-bold text-white shadow-card',
        happy ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-orange-500',
        className,
      )}
    >
      S
      <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-card bg-card text-sm">
        {happy ? '🙂' : '🤔'}
      </span>
    </span>
  )
}

type SardorCardProps = {
  line: SardorLine
  happy?: boolean
  className?: string
}

/** Sardor's message in a speech bubble; the text is always shown, the audio plays on tap. */
export function SardorCard({ line, happy, className }: SardorCardProps) {
  const audio = absoluteAudioUrl(line.audioUrl)
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <SardorAvatar happy={happy} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm">
          <span className="font-semibold">{t.checkpoint.sardor}</span>
          <span className="text-muted-foreground"> · {t.checkpoint.classmate}</span>
        </p>
        <div className="relative rounded-2xl rounded-tl-md border bg-card p-4 shadow-card">
          <MathText text={line.text} className="block text-[1.0625rem] leading-relaxed" />
          {audio && <AudioPlayer src={audio} label={t.checkpoint.audioLabel} className="mt-3" />}
        </div>
      </div>
    </div>
  )
}
