import { absoluteAudioUrl } from '@/api/checkpoint'
import type { SardorLine } from '@/api/types'
import { MathText } from '@/components/math-text'
import { Sardor, type SardorMood } from '@/components/sardor'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { AudioPlayer } from './audio-player'

/** Sardor on his own (intro, results). */
export function SardorAvatar({
  mood = 'confused',
  className,
}: {
  mood?: SardorMood
  className?: string
}) {
  return <Sardor mood={mood} className={cn('size-16', className)} />
}

type SardorCardProps = {
  line: SardorLine
  mood?: SardorMood
  /** 0–1 microphone level while the student records. */
  level?: number
  className?: string
}

/**
 * Sardor and what he says: a sticker speech bubble with the text always shown and the audio on tap.
 * Phones: Sardor beside the bubble. Desktop: Sardor large above it, on squared paper.
 */
export function SardorCard({ line, mood = 'confused', level = 0, className }: SardorCardProps) {
  const audio = absoluteAudioUrl(line.audioUrl)
  return (
    <div
      className={cn(
        'flex items-start gap-3 lg:flex-col lg:items-center lg:gap-5 lg:rounded-2xl lg:border-2 lg:border-ink lg:bg-katak lg:p-8',
        className,
      )}
    >
      <Sardor mood={mood} level={level} className="size-20 lg:order-2 lg:size-48" />
      <div className="min-w-0 flex-1 lg:order-1 lg:w-full">
        <p className="mb-1 text-sm lg:hidden">
          <span className="font-semibold">{t.checkpoint.sardor}</span>
          <span className="text-muted-foreground"> · {t.checkpoint.classmate}</span>
        </p>
        <div className="rounded-2xl rounded-tl-sm bg-card p-4 sticker lg:rounded-tl-2xl lg:rounded-bl-sm lg:p-5">
          <MathText
            text={line.text}
            className="block text-[1.0625rem] leading-relaxed lg:text-lg"
          />
          {audio && <AudioPlayer src={audio} label={t.checkpoint.audioLabel} className="mt-3" />}
        </div>
      </div>
    </div>
  )
}
