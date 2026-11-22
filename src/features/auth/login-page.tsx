import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'

import { ApiError, errorMessage } from '@/api/errors'
import { Wordmark } from '@/components/logo'
import { Sardor } from '@/components/sardor'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { LanguageSwitch } from '@/components/language-switch'
import { HelpButton } from '@/components/help'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/lib/use-document-title'

import { useAuth } from './auth-context'
import { formatLocal, isCompleteLocal, PHONE_PREFIX, toE164, toLocalDigits } from './phone'
import { WrongRoleScreen } from './wrong-role-screen'

type FieldErrors = { phone?: string; password?: string }

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return error.serverMessage?.toLowerCase().includes('deactivated')
      ? t('auth.deactivated')
      : t('auth.wrongCredentials')
  }
  return errorMessage(error)
}

export function LoginPage() {
  const { state, login } = useAuth()
  useDocumentTitle(t('auth.title'))
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
    if (!isCompleteLocal(digits)) errors.phone = t('auth.phoneInvalid')
    if (!password) errors.password = t('auth.passwordRequired')
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
    <main className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand: the squared notebook with Sardor asking to be taught. */}
      <section className="relative flex flex-col bg-katak px-4 pt-6 pb-10 lg:min-h-dvh lg:justify-between lg:border-r-2 lg:border-ink lg:px-14 lg:py-12">
        <div className="flex items-center justify-between gap-3">
          <Wordmark tagline="sm" />
          <div className="flex items-center gap-1">
            <LanguageSwitch variant="compact" />
            <HelpButton className="-mr-2" />
          </div>
        </div>
        <div className="mt-6 flex items-end gap-3 lg:mt-0 lg:flex-col lg:items-start lg:gap-6">
          <Sardor mood="confused" className="size-24 lg:order-2 lg:size-56" />
          <p className="relative mb-8 max-w-[15rem] rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-[0.95rem] leading-snug font-medium sticker lg:order-1 lg:mb-0 lg:max-w-md lg:px-6 lg:py-5 lg:text-xl">
            {t('auth.sardorHello')}
          </p>
        </div>
        <p className="mt-2 hidden max-w-md text-lg text-muted-foreground lg:block">
          {t('auth.tagline')}
        </p>
      </section>

      {/* The form, on a card that overlaps the paper on phones. */}
      <section className="relative -mt-6 flex flex-1 flex-col rounded-t-2xl border-t-2 border-ink bg-card px-4 pt-7 pb-10 lg:mt-0 lg:justify-center lg:rounded-none lg:border-t-0 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-tight">
            {t('auth.title')}
          </h1>
          <p className="mt-1 mb-6 text-muted-foreground">{t('auth.subtitle')}</p>

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.phone}>{t('auth.phone')}</Label>
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
                  placeholder={t('auth.phonePlaceholder')}
                  aria-label={`${t('auth.phone')} (${PHONE_PREFIX})`}
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
              <Label htmlFor={ids.password}>{t('auth.password')}</Label>
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
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
              {t('auth.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">{t('auth.forgotHint')}</p>
          </form>
        </div>
      </section>
    </main>
  )
}
