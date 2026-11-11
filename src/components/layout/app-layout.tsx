import { NavLink, Outlet, useMatches } from 'react-router'

import { Logo } from '@/components/logo'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { navItems } from './nav-items'

/** Tabbed screens: bottom tab bar on phones, left sidebar from md up. */
/** A route sets `handle: { wide: true }` to use the full width on desktop (text + chat). */
function useWideLayout(): boolean {
  return useMatches().some((m) => (m.handle as { wide?: boolean } | undefined)?.wide === true)
}

export function AppLayout() {
  const wide = useWideLayout()
  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card px-3 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-3">
          <Logo />
          <span className="text-lg font-bold">{t.app.name}</span>
        </div>
        <nav aria-label={t.nav.label}>
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-12 items-center gap-3 rounded-xl px-3 font-medium transition-colors',
                      isActive
                        ? 'bg-primary-soft text-primary-soft-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main
        className={cn(
          'mx-auto w-full px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-10',
          wide ? 'max-w-2xl lg:max-w-6xl' : 'max-w-2xl',
        )}
      >
        <Outlet />
      </main>

      <nav
        aria-label={t.nav.label}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] leading-tight font-medium transition-colors min-[380px]:text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'grid h-7 w-12 place-items-center rounded-full transition-colors',
                        isActive && 'bg-primary-soft',
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="max-w-full truncate">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
