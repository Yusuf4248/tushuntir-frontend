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

import { t } from '@/lib/i18n'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const navItems: NavItem[] = [
  {
    to: '/',
    get label() {
      return t('nav.home')
    },
    icon: House,
    end: true,
  },
  {
    to: '/topics',
    get label() {
      return t('nav.topics')
    },
    icon: BookOpen,
  },
  {
    to: '/self-study',
    get label() {
      return t('nav.selfStudy')
    },
    icon: Sparkles,
  },
  {
    to: '/profile',
    get label() {
      return t('nav.profile')
    },
    icon: UserRound,
  },
]

/** School screens: tiles on Home, a group in the desktop sidebar. */
export const schoolItems: NavItem[] = [
  {
    to: '/timetable',
    get label() {
      return t('school.timetable')
    },
    icon: CalendarDays,
  },
  {
    to: '/attendance',
    get label() {
      return t('school.attendance')
    },
    icon: CalendarCheck,
  },
  {
    to: '/grades',
    get label() {
      return t('school.grades')
    },
    icon: Star,
  },
  {
    to: '/homework',
    get label() {
      return t('school.homework')
    },
    icon: ClipboardPen,
  },
]

/** On phones the school screens belong to the Home tab. */
export const homeTabPaths = ['/timetable', '/attendance', '/grades', '/homework', '/notifications']
