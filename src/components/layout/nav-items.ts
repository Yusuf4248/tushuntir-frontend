import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardPen,
  House,
  Sparkles,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { t } from '@/lib/strings.uz'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const navItems: NavItem[] = [
  { to: '/', label: t.nav.home, icon: House, end: true },
  { to: '/topics', label: t.nav.topics, icon: BookOpen },
  { to: '/self-study', label: t.nav.selfStudy, icon: Sparkles },
  { to: '/profile', label: t.nav.profile, icon: UserRound },
]

/** School screens: tiles on Home, a group in the desktop sidebar. */
export const schoolItems: NavItem[] = [
  { to: '/timetable', label: t.school.timetable, icon: CalendarDays },
  { to: '/attendance', label: t.school.attendance, icon: CalendarCheck },
  { to: '/grades', label: t.school.grades, icon: Star },
  { to: '/homework', label: t.school.homework, icon: ClipboardPen },
]

/** On phones the school screens belong to the Home tab. */
export const homeTabPaths = ['/timetable', '/attendance', '/grades', '/homework', '/notifications']
