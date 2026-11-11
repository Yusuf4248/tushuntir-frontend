import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

type ToastVariant = 'info' | 'success' | 'error'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before it hides; 0 keeps it until closed. */
  duration?: number
}

type ToastItem = Required<Omit<ToastInput, 'description'>> & { id: number; description?: string }

const variantStyle: Record<ToastVariant, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'text-info' },
  success: { icon: CircleCheck, className: 'text-success' },
  error: { icon: CircleAlert, className: 'text-danger' },
}

type ToastApi = { toast: (input: ToastInput) => void; dismiss: (id: number) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }: ToastInput) => {
      const id = nextId.current++
      // Keep at most 3 on screen.
      setItems((list) => [...list.slice(-2), { id, title, description, variant, duration }])
      if (duration > 0) window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((item) => {
          const { icon: Icon, className } = variantStyle[item.variant]
          return (
            <div
              key={item.id}
              role={item.variant === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card p-3 pl-4 text-card-foreground shadow-lg"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={t.common.close}
                className="-my-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
