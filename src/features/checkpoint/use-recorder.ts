import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_SECONDS = 90
export const WARN_SECONDS = 75
export const MAX_BYTES = 5 * 1024 * 1024

export type RecorderError = 'denied' | 'unsupported' | 'no_device' | 'too_big' | 'failed'

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

// Chrome: webm/opus, Safari: mp4 (AAC), Firefox: ogg/opus.
const CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

function extensionFor(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

export function recorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function pickMimeType(): string | undefined {
  return CANDIDATES.find((type) => MediaRecorder.isTypeSupported?.(type))
}

function errorKind(error: unknown): RecorderError {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no_device'
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
        const type = rec.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type })
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
            fileName: `javob.${extensionFor(type)}`,
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
