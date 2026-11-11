import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth, useStudent } from '@/features/auth/auth-context'
import { t } from '@/lib/strings.uz'

export function ProfilePage() {
  const user = useStudent()
  const { logout } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  return (
    <>
      <PageHeader title={t.profile.title} />
      <Card className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary-soft-foreground"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">
            {user.firstName} {user.lastName}
          </p>
          {user.school && <p className="truncate text-muted-foreground">{user.school.name}</p>}
        </div>
      </Card>

      {user.phone && (
        <Card className="mt-3">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t.profile.phone}</dt>
            <dd className="font-medium tabular-nums">{user.phone}</dd>
          </dl>
        </Card>
      )}

      <Button
        variant="destructive"
        block
        className="mt-6"
        loading={leaving}
        onClick={() => {
          setLeaving(true)
          void logout()
        }}
      >
        <LogOut aria-hidden />
        {t.auth.logout}
      </Button>
    </>
  )
}
