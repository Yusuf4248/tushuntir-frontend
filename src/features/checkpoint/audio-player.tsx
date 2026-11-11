import { Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'

import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type AudioPlayerProps = {
  src: string
  label: string
  /** Hint for recordings whose duration the browser cannot read (webm). */
  knownDuration?: number
  className?: string
}

/** Play/pause with progress. Never autoplays: playback starts on a tap. */
export function AudioPlayer({ src, label, knownDuration, className }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(knownDuration ?? 0)

  const total = Number.isFinite(duration) && duration > 0 ? duration : (knownDuration ?? 0)
  const pct = total > 0 ? Math.min(100, (time / total) * 100) : 0

  function toggle() {
    const el = audio.current
    if (!el) return
    if (el.paused) void el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`${playing ? t.checkpoint.pause : t.checkpoint.play}: ${label}`}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {playing ? (
          <Pause className="size-5" aria-hidden />
        ) : (
          <Play className="ml-0.5 size-5" aria-hidden />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(time)}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {clock(time)} / {clock(total)}
        </p>
      </div>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setTime(0)
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  )
}
