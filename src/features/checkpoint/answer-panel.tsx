import { Keyboard, Mic, RotateCcw, Send, Square } from 'lucide-react'
import { useId, useState } from 'react'

import type { CheckpointAnswer } from '@/api/checkpoint'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { AudioPlayer } from './audio-player'
import {
  MAX_SECONDS,
  WARN_SECONDS,
  recorderSupported,
  useRecorder,
  type RecorderError,
} from './use-recorder'

const MAX_TEXT = 2000
const BAR_SHAPE = [0.45, 0.75, 1, 0.85, 0.6, 0.9, 0.5]

const errorText: Record<RecorderError, string> = {
  denied: t.checkpoint.micDenied,
  unsupported: t.checkpoint.micUnsupported,
  no_device: t.checkpoint.micMissing,
  failed: t.checkpoint.micFailed,
  too_big: t.checkpoint.tooBig,
}

function clock(seconds: number): string {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type AnswerPanelProps = {
  onSubmit: (answer: CheckpointAnswer) => void
  submitting: boolean
}

/** Answer by voice (one big microphone button) or, as a backup, by typing. */
export function AnswerPanel({ onSubmit, submitting }: AnswerPanelProps) {
  const { state, elapsed, level, start, stop, reset } = useRecorder()
  const [mode, setMode] = useState<'voice' | 'text'>(() => (recorderSupported() ? 'voice' : 'text'))
  const [text, setText] = useState('')
  const textId = useId()

  // A microphone that cannot be used switches to the typed answer.
  const micError =
    state.status === 'error' && state.error !== 'too_big' ? errorText[state.error] : null
  const unsupported = !recorderSupported()
  const showText = mode === 'text' || micError !== null || unsupported

  if (showText) {
    return (
      <div className="flex flex-col gap-3">
        {(micError ?? (unsupported ? t.checkpoint.micUnsupported : null)) && (
          <p role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
            {micError ?? t.checkpoint.micUnsupported}
          </p>
        )}
        <label htmlFor={textId} className="text-sm font-medium">
          {t.checkpoint.typedLabel}
        </label>
        <textarea
          id={textId}
          rows={5}
          maxLength={MAX_TEXT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.checkpoint.typedPlaceholder}
          className="min-h-32 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40"
        />
        <div className="flex items-center justify-between gap-3">
          {!unsupported ? (
            <Button
              variant="link"
              className="h-11 px-0"
              onClick={() => {
                if (micError) reset()
                setMode('voice')
              }}
            >
              <Mic aria-hidden />
              {t.checkpoint.voiceInstead}
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX_TEXT}
          </span>
        </div>
        <Button
          size="lg"
          block
          disabled={!text.trim() || submitting}
          loading={submitting}
          onClick={() => onSubmit({ kind: 'text', text: text.trim() })}
        >
          {!submitting && <Send aria-hidden />}
          {t.checkpoint.send}
        </Button>
      </div>
    )
  }

  const recording = state.status === 'recording'
  const left = Math.max(0, Math.ceil(MAX_SECONDS - elapsed))
  const warn = recording && elapsed >= WARN_SECONDS

  return (
    <div className="flex flex-col items-center gap-4">
      {state.status === 'recorded' ? (
        <div className="flex w-full flex-col gap-3">
          <p className="text-sm font-medium">{t.checkpoint.yourRecording}</p>
          <div className="rounded-xl border bg-card p-3 shadow-card">
            <AudioPlayer
              src={state.recording.url}
              label={t.checkpoint.yourRecording}
              knownDuration={state.recording.seconds}
            />
          </div>
          {state.autoStopped && (
            <p className="text-sm text-warning" role="status">
              {t.checkpoint.maxReached}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={reset} disabled={submitting}>
              <RotateCcw aria-hidden />
              {t.checkpoint.reRecord}
            </Button>
            <Button
              size="lg"
              loading={submitting}
              onClick={() =>
                onSubmit({
                  kind: 'voice',
                  audio: state.recording.blob,
                  fileName: state.recording.fileName,
                })
              }
            >
              {!submitting && <Send aria-hidden />}
              {t.checkpoint.send}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
            {recording ? t.checkpoint.recording : t.checkpoint.yourTurn}
          </p>
          <div className="relative grid size-36 place-items-center">
            {/* Level ring: grows with the voice. */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 rounded-full transition-transform duration-100',
                recording ? 'bg-danger/15' : 'bg-primary-soft',
              )}
              style={{ transform: `scale(${recording ? 0.8 + level * 0.35 : 0.9})` }}
            />
            <button
              type="button"
              onClick={recording ? stop : () => void start()}
              disabled={state.status === 'requesting'}
              aria-pressed={recording}
              aria-label={recording ? t.checkpoint.tapToStop : t.checkpoint.tapToRecord}
              className={cn(
                'relative grid size-24 cursor-pointer place-items-center rounded-full text-white shadow-lg transition-colors focus-visible:outline-4 disabled:opacity-60',
                recording ? 'bg-danger hover:brightness-110' : 'bg-primary hover:bg-primary-hover',
              )}
            >
              {recording ? (
                <Square className="size-9 fill-current" aria-hidden />
              ) : (
                <Mic className="size-11" aria-hidden />
              )}
            </button>
          </div>

          {recording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 items-center gap-1" aria-hidden>
                {BAR_SHAPE.map((shape, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-danger transition-[height] duration-100"
                    style={{ height: `${Math.max(12, Math.min(100, level * 140 * shape))}%` }}
                  />
                ))}
              </div>
              <p
                className={cn('text-lg font-semibold tabular-nums', warn && 'text-warning')}
                role="timer"
              >
                {clock(elapsed)} / {clock(MAX_SECONDS)}
              </p>
              {warn && (
                <p className="text-sm font-medium text-warning" role="status">
                  {t.checkpoint.secondsLeft(left)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.checkpoint.tapToRecord}</p>
          )}

          {state.status === 'error' && state.error === 'too_big' && (
            <p role="alert" className="text-center text-sm text-danger">
              {errorText.too_big}
            </p>
          )}
        </>
      )}

      <Button
        variant="link"
        className="h-11"
        disabled={submitting}
        onClick={() => {
          if (recording) stop()
          setMode('text')
        }}
      >
        <Keyboard aria-hidden />
        {t.checkpoint.typeInstead}
      </Button>
    </div>
  )
}
