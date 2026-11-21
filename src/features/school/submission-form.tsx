import { Camera, FileText, ImagePlus, Loader2, Send, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { ApiError, errorMessage } from '@/api/errors'
import { useSubmitHomework } from '@/api/school'
import type { HomeworkDetail } from '@/api/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatBytes } from '@/lib/format'
import { prepareImage } from '@/lib/image'
import { t } from '@/lib/i18n'

/** Backend limits (MAX_SUBMISSION_FILES, MAX_SUBMISSION_FILE_BYTES, text MaxLength). */
const MAX_FILES = 3
const MAX_BYTES = 10 * 1024 * 1024
const MAX_TEXT = 5000
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

type Picked = { key: string; file: File; preview: string | null }

const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
const looksLikeImage = (f: File) =>
  (f.type.startsWith('image/') && f.type !== 'image/svg+xml') || /\.(heic|heif)$/i.test(f.name)

export function SubmissionForm({ homework }: { homework: HomeworkDetail }) {
  const existing = homework.submission
  const submit = useSubmitHomework(homework.id)
  const { toast } = useToast()
  const textId = useId()
  const [text, setText] = useState(existing?.text ?? '')
  const [picked, setPicked] = useState<Picked[]>([])
  const [problems, setProblems] = useState<string[]>([])
  const [preparing, setPreparing] = useState(false)
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const pdf = useRef<HTMLInputElement>(null)
  const urls = useRef(new Set<string>())

  // Free the preview images when leaving the page.
  useEffect(() => {
    const created = urls.current
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  async function addFiles(list: FileList | null) {
    if (!list?.length) return
    const errors: string[] = []
    const added: Picked[] = []
    setPreparing(true)
    for (const original of Array.from(list)) {
      if (picked.length + added.length >= MAX_FILES) {
        errors.push(t('homework.tooMany'))
        break
      }
      let file = original
      if (looksLikeImage(original)) {
        try {
          file = await prepareImage(original)
        } catch {
          errors.push(t('homework.unreadableImage', { name: original.name }))
          continue
        }
      } else if (!isPdf(original)) {
        errors.push(t('homework.badType', { name: original.name }))
        continue
      }
      const type = isPdf(file) ? 'application/pdf' : file.type
      if (!ALLOWED.includes(type)) {
        errors.push(t('homework.badType', { name: original.name }))
        continue
      }
      if (file.size > MAX_BYTES) {
        errors.push(t('homework.tooBig', { name: original.name }))
        continue
      }
      const preview = type.startsWith('image/') ? URL.createObjectURL(file) : null
      if (preview) urls.current.add(preview)
      added.push({ key: `${Date.now()}-${added.length}-${file.name}`, file, preview })
    }
    setPreparing(false)
    setPicked((p) => [...p, ...added])
    setProblems([...new Set(errors)])
  }

  function remove(key: string) {
    setPicked((p) => {
      const gone = p.find((x) => x.key === key)
      if (gone?.preview) {
        URL.revokeObjectURL(gone.preview)
        urls.current.delete(gone.preview)
      }
      return p.filter((x) => x.key !== key)
    })
  }

  function send() {
    const trimmed = text.trim()
    if (!trimmed && picked.length === 0 && !existing) {
      setProblems([t('homework.nothingToSend')])
      return
    }
    setProblems([])
    submit.mutate(
      { text: trimmed ? trimmed : undefined, files: picked.map((p) => p.file) },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: t('homework.sent') })
          picked.forEach((p) => p.preview && URL.revokeObjectURL(p.preview))
          setPicked([])
        },
      },
    )
  }

  const errorText =
    submit.error instanceof ApiError && submit.error.status === 409
      ? t('homework.lockedConflict')
      : submit.error
        ? errorMessage(submit.error)
        : null

  return (
    <section
      aria-labelledby="answer-title"
      className="rounded-xl border bg-card p-4 shadow-card sm:p-5"
    >
      <h2 id="answer-title" className="mb-3 text-lg font-semibold">
        {existing ? t('homework.editTitle') : t('homework.answerTitle')}
      </h2>

      <label htmlFor={textId} className="mb-1.5 block text-sm font-medium">
        {t('homework.textLabel')}
      </label>
      <textarea
        id={textId}
        rows={5}
        maxLength={MAX_TEXT}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('homework.textPlaceholder')}
        className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40"
      />
      <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
        {text.length}/{MAX_TEXT}
      </p>

      <p className="mt-3 text-sm font-medium">{t('homework.files')}</p>
      <p className="mb-2 text-xs text-muted-foreground">{t('homework.filesHint')}</p>

      {picked.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {picked.map((p) => (
            <li key={p.key} className="relative overflow-hidden rounded-xl border bg-muted">
              {p.preview ? (
                <img
                  src={p.preview}
                  alt={p.file.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <FileText className="size-7 text-muted-foreground" aria-hidden />
                  <span className="line-clamp-2 text-xs break-all">{p.file.name}</span>
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-[11px] text-white tabular-nums">
                {formatBytes(p.file.size)}
              </span>
              <button
                type="button"
                onClick={() => remove(p.key)}
                aria-label={t('homework.removeFile', { name: p.file.name })}
                className="absolute top-1 right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={picked.length >= MAX_FILES || preparing}
          onClick={() => camera.current?.click()}
        >
          <Camera aria-hidden />
          {t('homework.camera')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={picked.length >= MAX_FILES || preparing}
          onClick={() => gallery.current?.click()}
        >
          <ImagePlus aria-hidden />
          {t('homework.gallery')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={picked.length >= MAX_FILES || preparing}
          onClick={() => pdf.current?.click()}
        >
          <FileText aria-hidden />
          {t('homework.pdf')}
        </Button>
      </div>
      {/* Reset the value after each pick so the same file can be chosen again. */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={pdf}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {preparing && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t('homework.preparing')}
        </p>
      )}
      {existing && existing.files.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {picked.length > 0 ? t('homework.replaceNote') : t('homework.keepFilesNote')}
        </p>
      )}

      {(problems.length > 0 || errorText) && (
        <ul
          role="alert"
          className="mt-3 flex flex-col gap-1 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
          {errorText && <li>{errorText}</li>}
        </ul>
      )}

      <Button
        size="lg"
        block
        className="mt-4"
        onClick={send}
        loading={submit.isPending}
        disabled={preparing}
      >
        {!submit.isPending && <Send aria-hidden />}
        {existing ? t('homework.resend') : t('homework.send')}
      </Button>
    </section>
  )
}
