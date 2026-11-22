import { Bell } from 'lucide-react'
import { NavLink, Outlet, useLocation, useMatches } from 'react-router'

import { useUnreadCount } from '@/api/notifications'
import { Wordmark } from '@/components/logo'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

import { homeTabPaths, navItems, schoolItems, type NavItem } from './nav-items'

/** A route sets `handle: { wide: true }` to use the full width on desktop (text + chat). */
function useWideLayout(): boolean {
  return useMatches().some((m) => (m.handle as { wide?: boolean } | undefined)?.wide === true)
}

const sideLink = (isActive: boolean) =>
  cn(
    'flex h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors',
    isActive
      ? 'bg-primary-soft text-primary-soft-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

function SideLink({ to, label, icon: Icon, end, badge }: NavItem & { badge?: number }) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => sideLink(isActive)}>
        <Icon className="size-5" aria-hidden />
        <span className="flex-1">{label}</span>
        {badge ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger-solid px-1 text-xs font-bold text-white tabular-nums">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}

/** Tabbed screens: bottom tab bar on phones, left sidebar from md up. */
export function AppLayout() {
  const { pathname } = useLocation()
  // Home lays out two columns on desktop.
  const wide = useWideLayout() || pathname === '/'
  const unread = useUnreadCount().data ?? 0
  // The school screens open from Home, so on phones the Home tab stays highlighted.
  const inHomeTab = homeTabPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r bg-card px-3 py-5 md:flex">
        <Wordmark tagline className="mb-6 px-3" />
        <nav aria-label={t('nav.label')} className="flex flex-col gap-6">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <SideLink key={item.to} {...item} />
            ))}
          </ul>
          <div>
            <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('school.title')}
            </p>
            <ul className="flex flex-col gap-1">
              {schoolItems.map((item) => (
                <SideLink key={item.to} {...item} />
              ))}
              <SideLink
                to={paths.notifications}
                label={t('school.notifications')}
                icon={Bell}
                badge={unread}
              />
            </ul>
          </div>
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
        aria-label={t('nav.label')}
        data-tab-bar
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
                    isActive || (to === '/' && inHomeTab)
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => {
                  const active = isActive || (to === '/' && inHomeTab)
                  return (
                    <>
                      <span
                        className={cn(
                          'grid h-7 w-12 place-items-center rounded-full transition-colors',
                          active && 'bg-primary-soft',
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="max-w-full truncate">{label}</span>
                    </>
                  )
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
