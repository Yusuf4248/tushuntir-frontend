import { BookOpen, House, Sparkles, UserRound, type LucideIcon } from 'lucide-react'

import { t } from '@/lib/strings.uz'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const navItems: NavItem[] = [
  { to: '/', label: t.nav.home, icon: House, end: true },
  { to: '/topics', label: t.nav.topics, icon: BookOpen },
  { to: '/self-study', label: t.nav.selfStudy, icon: Sparkles },
  { to: '/profile', label: t.nav.profile, icon: UserRound },
]
