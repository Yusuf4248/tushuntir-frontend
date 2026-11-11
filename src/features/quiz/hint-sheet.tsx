import { Lightbulb, MessageCircleWarning } from 'lucide-react'

import { MathText } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { t } from '@/lib/strings.uz'

type HintSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** level → text, for the levels whose text this tab knows */
  hints: Record<number, string>
  used: number
  available: number
  misconception: string | null
  onRequest: () => void
  loading: boolean
}

export function HintSheet({
  open,
  onOpenChange,
  hints,
  used,
  available,
  misconception,
  onRequest,
  loading,
}: HintSheetProps) {
  const shown = Object.entries(hints)
    .map(([level, text]) => ({ level: Number(level), text }))
    .sort((a, b) => a.level - b.level)
  const unknown = used - shown.length
  const canAsk = used < available

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t.quiz.hintTitle}
      description={t.quiz.hintsUsed(used, available)}
      footer={
        canAsk ? (
          <Button block onClick={onRequest} loading={loading}>
            {!loading && <Lightbulb aria-hidden />}
            {used === 0 ? t.quiz.firstHint : t.quiz.nextHint}
          </Button>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">{t.quiz.noMoreHints}</p>
        )
      }
    >
      {used === 0 && <p className="text-muted-foreground">{t.quiz.hintIntro}</p>}

      {unknown > 0 && (
        <p className="mb-3 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t.quiz.hintsSeenEarlier(unknown)}
        </p>
      )}

      {shown.length > 0 && (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {shown.map(({ level, text }) => (
            <li key={level} className="rounded-xl border bg-primary-soft/60 p-4">
              <p className="mb-1 text-sm font-semibold text-primary-soft-foreground">
                {t.quiz.hintLevel(level)}
              </p>
              <MathText text={text} className="leading-relaxed" />
            </li>
          ))}
        </ol>
      )}

      {misconception && (
        <div className="mt-3 rounded-xl border border-warning/30 bg-warning-soft p-4" role="note">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-warning">
            <MessageCircleWarning className="size-4" aria-hidden />
            {t.quiz.misconceptionTitle}
          </p>
          <MathText text={misconception} className="leading-relaxed" />
        </div>
      )}
    </Sheet>
  )
}
