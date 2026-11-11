import { Button } from '@/components/ui/button'
import { useAuth, useStudent } from '@/features/auth/auth-context'
import { t } from '@/lib/strings.uz'

// Temporary until the layout step.
export function TempHome() {
  const user = useStudent()
  const { logout } = useAuth()
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <p>{user.firstName}</p>
      <Button onClick={() => void logout()}>{t.auth.logout}</Button>
    </main>
  )
}
