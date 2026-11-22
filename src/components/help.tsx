import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { Sardor } from '@/components/sardor'
import i18n, { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type HelpPage =
  | 'login'
  | 'dashboard'
  | 'quiz'
  | 'review'
  | 'textbook'
  | 'selfStudy'
  | 'checkpoint'
  | 'timetable'
  | 'attendance'
  | 'grades'
  | 'homework'
  | 'notifications'
  | 'profile'

/** Which help a screen shows, from its address. */
function helpPageFor(pathname: string): HelpPage {
  const [first = '', , third] = pathname.split('/').slice(1)
  switch (first) {
    case 'login':
      return 'login'
    case 'topics':
    case 'chat':
      return 'textbook'
    case 'self-study':
      return 'selfStudy'
    case 'quiz':
    case 'practice':
      return 'quiz'
    case 'attempts':
      return third === 'review' ? 'review' : 'quiz'
    case 'checkpoint':
      return 'checkpoint'
    case 'timetable':
    case 'attendance':
    case 'grades':
    case 'homework':
    case 'notifications':
    case 'profile':
      return first
    default:
      return 'dashboard'
  }
}

type HelpContent = { title: string; steps: string[]; example?: string }

function helpContent(page: HelpPage): HelpContent {
  return i18n.t(`help.pages.${page}`, { returnObjects: true }) as unknown as HelpContent
}

// First-visit hint: shown on the first screen of the first visit only, then never again.
const HINT_KEY = 'tushuntir.helpHint'
let hintPath: string | null = null
let hintDismissed = false

function hintSeenBefore(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === 'seen'
  } catch {
    return true
  }
}

function markHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, 'seen')
  } catch {
    // Without storage the hint simply shows again next visit.
  }
}

/** Claims the hint for this screen on the first visit; later screens and visits get none. */
function useFirstVisitHint(pathname: string): [boolean, () => void] {
  const [claimed] = useState(() => {
    if (hintDismissed) return false
    if (hintPath === null) {
      if (hintSeenBefore()) {
        hintDismissed = true
        return false
      }
      hintPath = pathname
    }
    return hintPath === pathname
  })
  const [dismissed, setDismissed] = useState(false)
  const visible = claimed && !dismissed && !hintDismissed && pathname === hintPath

  useEffect(() => {
    // Remember it straight away, so a reload or another visit never shows it again.
    if (visible) markHintSeen()
  }, [visible])

  useEffect(() => {
    // Leaving the first screen ends the hint for good.
    if (hintPath !== null && pathname !== hintPath) hintDismissed = true
  }, [pathname])

  const dismiss = () => {
    hintDismissed = true
    setDismissed(true)
  }
  return [visible, dismiss]
}

/** The "?" in the top-right corner of every screen: opens help for that screen. */
export function HelpButton({ page, className }: { page?: HelpPage; className?: string }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [hint, dismissHint] = useFirstVisitHint(pathname)
  const current = page ?? helpPageFor(pathname)

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        type="button"
        aria-label={t('help.button')}
        aria-haspopup="dialog"
        onClick={() => {
          dismissHint()
          setOpen(true)
        }}
        className="group grid size-11 cursor-pointer place-items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className={cn(
            'grid size-8 place-items-center rounded-full border-2 border-ink bg-card font-display text-sm font-bold text-foreground transition-colors group-hover:bg-muted',
            hint && 'bg-sardor text-on-sardor motion-safe:animate-help-ring',
          )}
        >
          ?
        </span>
      </button>

      {hint && (
        <div
          role="status"
          className="absolute top-full right-0 z-40 mt-2 w-60 rounded-2xl bg-sardor-soft p-3 text-foreground sticker motion-safe:animate-help-bob"
        >
          {/* The arrow, pointing up at the button. */}
          <span
            aria-hidden
            className="absolute -top-[7px] right-4 size-3 rotate-45 border-t-2 border-l-2 border-ink bg-sardor-soft"
          />
          <p className="text-sm leading-snug font-medium">{t('help.hint')}</p>
          <button
            type="button"
            onClick={dismissHint}
            className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border-2 border-ink bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t('help.gotIt')}
          </button>
        </div>
      )}

      <HelpPanel page={current} open={open} onOpenChange={setOpen} />
    </div>
  )
}

/** Help for one screen: a bottom sheet on phones, a side panel from tablet width up. */
function HelpPanel({
  page,
  open,
  onOpenChange,
}: {
  page: HelpPage
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const content = helpContent(page)
  const numbered = content.steps.length > 1
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t-2 border-ink bg-card text-card-foreground shadow-xl outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in',
            'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[24rem] md:rounded-none md:rounded-l-2xl md:border-t-0 md:border-l-2 md:data-[state=closed]:animate-side-out md:data-[state=open]:animate-side-in',
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted md:hidden" aria-hidden />
          <div className="flex items-center gap-3 border-b px-5 pt-3 pb-3 md:pt-6">
            <Sardor mood="happy" className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{t('help.title')}</p>
              <Dialog.Title className="font-display text-lg leading-tight font-semibold">
                {content.title}
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="-mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-muted"
              aria-label={t('common.close')}
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{content.steps.join(' ')}</Dialog.Description>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {numbered ? (
              <ol className="flex flex-col gap-3">
                {content.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      aria-hidden
                      className="grid size-7 shrink-0 place-items-center rounded-md border-2 border-input font-display text-xs font-semibold"
                    >
                      {i + 1}
                    </span>
                    <p className="pt-0.5 leading-snug">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="leading-snug">{content.steps[0]}</p>
            )}

            {content.example && (
              <div className="mt-5 rounded-xl border-2 border-ink bg-katak p-4">
                <p className="mb-1 inline-block rounded-md bg-sardor px-2 py-0.5 text-xs font-semibold text-on-sardor">
                  {t('help.example')}
                </p>
                <p className="leading-snug font-medium">{content.example}</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
