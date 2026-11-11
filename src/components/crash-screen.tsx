import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'

/** Shown when rendering fails. Plain links and reload only: the router may be the broken part. */
export function CrashScreen() {
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-4 py-10 text-center"
    >
      <span className="mb-2 grid size-16 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-xl font-bold">{t.crash.title}</h1>
      <p className="text-muted-foreground">{t.crash.description}</p>
      <div className="mt-4 flex w-full flex-col gap-3">
        <Button size="lg" block onClick={() => window.location.reload()}>
          <RefreshCw aria-hidden />
          {t.crash.reload}
        </Button>
        <Button asChild variant="outline" block>
          <a href="/">{t.crash.home}</a>
        </Button>
      </div>
    </main>
  )
}
