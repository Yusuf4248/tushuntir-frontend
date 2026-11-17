import { FileText, ImageOff } from 'lucide-react'
import { useState } from 'react'

import type { FileRef } from '@/api/types'
import { apiFileUrl } from '@/lib/api-url'
import { formatBytes } from '@/lib/format'

const isImage = (f: Pick<FileRef, 'mimeType' | 'originalName'>) =>
  (f.mimeType ?? '').startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.originalName ?? '')

/**
 * A file from the API, used exactly by its `url` (signed links for my submission files).
 * A broken image (e.g. an expired link, 403) asks the page for fresh links once.
 */
export function FileTile({ file, onExpired }: { file: FileRef; onExpired?: () => void }) {
  const href = apiFileUrl(file.url)
  const [broken, setBroken] = useState(false)
  const name = file.originalName ?? file.url.split('/').pop()?.split('?')[0] ?? 'fayl'

  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-14 items-center gap-3 rounded-xl border bg-card p-2 pr-3 transition-colors hover:bg-muted"
    >
      {isImage(file) && !broken ? (
        <img
          src={href}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-lg bg-muted object-cover"
          onError={() => {
            setBroken(true)
            onExpired?.()
          }}
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          {isImage(file) ? (
            <ImageOff className="size-5" aria-hidden />
          ) : (
            <FileText className="size-5" aria-hidden />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
      </span>
    </a>
  )
}
