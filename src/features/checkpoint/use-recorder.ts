import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_SECONDS = 90
export const WARN_SECONDS = 75
export const MAX_BYTES = 5 * 1024 * 1024

export type RecorderError = 'denied' | 'unsupported' | 'no_device' | 'busy' | 'too_big' | 'failed'

export type Recording = {
  blob: Blob
  url: string
  mimeType: string
  fileName: string
  seconds: number
}

type State =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'recording' }
  | { status: 'recorded'; recording: Recording; autoStopped: boolean }
  | { status: 'error'; error: RecorderError }

/**
 * Recording formats in order of preference. Safari (every iOS browser runs on it) records AAC in
 * MP4; newer Safari can also record WebM, but MP4 is its native, best-tested format. Chrome, Edge
 * and Firefox record Opus in WebM (Firefox falls back to Ogg).
 */
const SAFARI_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
const OTHER_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

/** The upload's type and file name: the base MIME type (no codecs) and a matching extension. */
const UPLOAD_FORMATS: Record<string, { type: string; ext: string }> = {
  'audio/webm': { type: 'audio/webm', ext: 'webm' },
  'video/webm': { type: 'audio/webm', ext: 'webm' },
  'audio/mp4': { type: 'audio/mp4', ext: 'm4a' },
  'video/mp4': { type: 'audio/mp4', ext: 'm4a' },
  'audio/x-m4a': { type: 'audio/mp4', ext: 'm4a' },
  'audio/ogg': { type: 'audio/ogg', ext: 'ogg' },
}

function isSafari(): boolean {
  // WebKit without Chromium: desktop Safari and every browser on iOS / iPadOS.
  return (
    /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg\//.test(navigator.userAgent)
  )
}

function uploadFormat(recorded: string): { type: string; ext: string } {
  const base = recorded.split(';')[0]!.trim().toLowerCase()
  return (
    UPLOAD_FORMATS[base] ??
    (isSafari() ? UPLOAD_FORMATS['audio/mp4']! : UPLOAD_FORMATS['audio/webm']!)
  )
}

export function recorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function pickMimeType(): string | undefined {
  // Very old Safari has no isTypeSupported: let it use its default (MP4).
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined
  return (isSafari() ? SAFARI_TYPES : OTHER_TYPES).find((type) =>
    MediaRecorder.isTypeSupported(type),
  )
}

function errorKind(error: unknown): RecorderError {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no_device'
  // The microphone exists but another app (a call, another tab) holds it.
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy'
  if (name === 'NotSupportedError') return 'unsupported'
  return 'failed'
}

/**
 * Microphone recording with MediaRecorder: elapsed time, a 0–1 input level for the animation,
 * auto-stop at 90 s, and a 5 MB check. The recording stays until reset() or a new start().
 */
export function useRecorder() {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)

  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const frame = useRef<number | null>(null)
  const tick = useRef<number | null>(null)
  const startedAt = useRef(0)
  const autoStopped = useRef(false)
  const urlRef = useRef<string | null>(null)

  const cleanupDevices = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (tick.current !== null) window.clearInterval(tick.current)
    frame.current = null
    tick.current = null
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    void audioCtx.current?.close().catch(() => undefined)
    audioCtx.current = null
    setLevel(0)
  }, [])

  const revoke = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }, [])

  // Release the microphone and the object URL when the screen goes away.
  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') recorder.current.stop()
      cleanupDevices()
      revoke()
    },
    [cleanupDevices, revoke],
  )

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  const start = useCallback(async () => {
    if (!recorderSupported()) {
      setState({ status: 'error', error: 'unsupported' })
      return
    }
    revoke()
    setState({ status: 'requesting' })
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      stream.current = media
      const mimeType = pickMimeType()
      // ~32 kbps keeps 90 s of speech near 400 KB, far below the 5 MB limit.
      const rec = new MediaRecorder(media, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32_000,
      })
      recorder.current = rec
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      rec.onstop = () => {
        const seconds = Math.min((Date.now() - startedAt.current) / 1000, MAX_SECONDS)
        cleanupDevices()
        // What the browser actually recorded, as precisely as it tells us.
        const recorded = rec.mimeType || chunks[0]?.type || mimeType || ''
        const { type, ext } = uploadFormat(recorded)
        const blob = new Blob(chunks, { type })
        if (blob.size === 0) {
          setState({ status: 'error', error: 'failed' })
          return
        }
        if (blob.size > MAX_BYTES) {
          setState({ status: 'error', error: 'too_big' })
          return
        }
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setState({
          status: 'recorded',
          autoStopped: autoStopped.current,
          recording: {
            blob,
            url,
            mimeType: type,
            fileName: `javob.${ext}`,
            seconds,
          },
        })
      }

      // Input level for the animation.
      try {
        const ctx = new AudioContext()
        audioCtx.current = ctx
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        ctx.createMediaStreamSource(media).connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        let last = 0
        const loop = (now: number) => {
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (const v of data) sum += ((v - 128) / 128) ** 2
          const rms = Math.sqrt(sum / data.length)
          if (now - last > 66) {
            setLevel(Math.min(1, rms * 4))
            last = now
          }
          frame.current = requestAnimationFrame(loop)
        }
        frame.current = requestAnimationFrame(loop)
      } catch {
        // The level animation is decoration; recording works without it.
      }

      autoStopped.current = false
      startedAt.current = Date.now()
      setElapsed(0)
      rec.start(1000)
      setState({ status: 'recording' })
      tick.current = window.setInterval(() => {
        const seconds = (Date.now() - startedAt.current) / 1000
        setElapsed(seconds)
        if (seconds >= MAX_SECONDS) {
          autoStopped.current = true
          stop()
        }
      }, 250)
    } catch (error) {
      cleanupDevices()
      setState({ status: 'error', error: errorKind(error) })
    }
  }, [cleanupDevices, revoke, stop])

  const reset = useCallback(() => {
    revoke()
    setElapsed(0)
    setState({ status: 'idle' })
  }, [revoke])

  return { state, elapsed, level, start, stop, reset }
}
