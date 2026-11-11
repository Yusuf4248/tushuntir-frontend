import { UserX } from 'lucide-react'

import type { AuthUser } from '@/api/types'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'

import { useAuth } from './auth-context'

export function WrongRoleScreen({ user }: { user: AuthUser }) {
  const { reset } = useAuth()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-warning-soft text-warning">
        <UserX className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">{t.auth.studentsOnly}</h1>
      <p className="text-muted-foreground">{t.auth.studentsOnlyHint(user.firstName)}</p>
      <Button size="lg" block className="mt-4" onClick={reset}>
        {t.auth.otherAccount}
      </Button>
    </main>
  )
}
