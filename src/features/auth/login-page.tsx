import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'

import { ApiError, errorMessage } from '@/api/errors'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { t } from '@/lib/strings.uz'

import { useAuth } from './auth-context'
import { formatLocal, isCompleteLocal, PHONE_PREFIX, toE164, toLocalDigits } from './phone'
import { WrongRoleScreen } from './wrong-role-screen'

type FieldErrors = { phone?: string; password?: string }

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return error.serverMessage?.toLowerCase().includes('deactivated')
      ? t.auth.deactivated
      : t.auth.wrongCredentials
  }
  return errorMessage(error)
}

export function LoginPage() {
  const { state, login } = useAuth()
  const location = useLocation()
  const ids = { phone: useId(), password: useId(), phoneErr: useId(), passwordErr: useId() }

  const [digits, setDigits] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (state.status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }
  if (state.status === 'wrong_role') return <WrongRoleScreen user={state.user} />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}
    if (!isCompleteLocal(digits)) errors.phone = t.auth.phoneInvalid
    if (!password) errors.password = t.auth.passwordRequired
    setFieldErrors(errors)
    setFormError(null)
    if (errors.phone || errors.password) return

    setSubmitting(true)
    try {
      await login(toE164(digits), password)
    } catch (error) {
      setFormError(loginErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo className="size-14" />
        <h1 className="text-2xl font-bold">{t.auth.title}</h1>
        <p className="text-muted-foreground">{t.auth.subtitle}</p>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.phone}>{t.auth.phone}</Label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-muted-foreground"
            >
              {PHONE_PREFIX}
            </span>
            <Input
              id={ids.phone}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={t.auth.phonePlaceholder}
              aria-label={`${t.auth.phone} (${PHONE_PREFIX})`}
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? ids.phoneErr : undefined}
              className="pl-[4.25rem] tracking-wide tabular-nums"
              value={formatLocal(digits)}
              onChange={(e) => setDigits(toLocalDigits(e.target.value))}
            />
          </div>
          {fieldErrors.phone && (
            <p id={ids.phoneErr} className="text-sm text-danger">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.password}>{t.auth.password}</Label>
          <div className="relative">
            <Input
              id={ids.password}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? ids.passwordErr : undefined}
              className="pr-14"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0.5 my-auto grid size-11 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden />
              ) : (
                <Eye className="size-5" aria-hidden />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p id={ids.passwordErr} className="text-sm text-danger">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        )}

        <Button type="submit" size="lg" block loading={submitting}>
          {t.auth.submit}
        </Button>

        <p className="text-center text-sm text-muted-foreground">{t.auth.forgotHint}</p>
      </form>
    </main>
  )
}
