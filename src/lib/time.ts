import { useEffect, useState } from 'react'

import { t, tList } from '@/lib/i18n'

/** Used until /me/today tells us the school's zone. */
export const DEFAULT_TIMEZONE = 'Asia/Tashkent'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "YYYY-MM-DD" of an instant in the given zone. */
export function dateInZone(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

/** "22:00" in the given zone. */
export function clockInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

export function parseDate(date: string): { y: number; m: number; d: number } {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number)
  return { y, m, d }
}

export function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** "11-noyabr" / "11 ноября" / "11 November" */
export function dayMonth(date: string): string {
  const { m, d } = parseDate(date)
  return t('time.dayMonth', { day: d, month: tList('time.months')[m - 1] ?? '' })
}

/** "Chorshanba, 11-noyabr" for a "YYYY-MM-DD" school date. */
export function weekdayDate(date: string): string {
  const { y, m, d } = parseDate(date)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return t('time.weekdayDate', {
    weekday: tList('time.weekdays')[weekday] ?? '',
    date: dayMonth(date),
  })
}

/** "Bugun 22:00", "Ertaga 09:00", "14-noyabr, 22:00" relative to the school's today. */
export function relativeDayTime(iso: string, today: string, timeZone: string): string {
  const day = dateInZone(iso, timeZone)
  const time = clockInZone(iso, timeZone)
  if (day === today) return t('time.todayAt', { time })
  if (day === addDays(today, 1)) return t('time.tomorrowAt', { time })
  if (day === addDays(today, -1)) return t('time.yesterdayAt', { time })
  return t('time.dateAt', { date: dayMonth(day), time })
}

/** "2 soat 15 daqiqa qoldi" */
export function timeLeft(ms: number): string {
  if (ms <= 0) return t('time.expired')
  if (ms < MINUTE) return t('time.lessThanMinute')
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / MINUTE)
  const pair = (first: string, second: string | null) =>
    second ? t('time.pair', { first, second }) : first
  if (days > 0)
    return t('time.left', {
      amount: pair(
        t('time.days', { count: days }),
        hours > 0 ? t('time.hours', { count: hours }) : null,
      ),
    })
  if (hours > 0)
    return t('time.left', {
      amount: pair(
        t('time.hours', { count: hours }),
        minutes > 0 ? t('time.minutes', { count: minutes }) : null,
      ),
    })
  return t('time.left', { amount: t('time.minutes', { count: minutes }) })
}

export const URGENT_MS = HOUR

/** Current time, re-rendering every `intervalMs`. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
