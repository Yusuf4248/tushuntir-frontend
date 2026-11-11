import { useEffect, useState } from 'react'

import { t } from './strings.uz'

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

function parseDate(date: string): { y: number; m: number; d: number } {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number)
  return { y, m, d }
}

function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** "11-noyabr" */
export function dayMonth(date: string): string {
  const { m, d } = parseDate(date)
  return `${d}-${t.time.months[m - 1] ?? ''}`
}

/** "Chorshanba, 11-noyabr" for a "YYYY-MM-DD" school date. */
export function weekdayDate(date: string): string {
  const { y, m, d } = parseDate(date)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return `${t.time.weekdays[weekday] ?? ''}, ${dayMonth(date)}`
}

/** "Bugun 22:00", "Ertaga 09:00", "14-noyabr, 22:00" relative to the school's today. */
export function relativeDayTime(iso: string, today: string, timeZone: string): string {
  const day = dateInZone(iso, timeZone)
  const clock = clockInZone(iso, timeZone)
  if (day === today) return `${t.time.today} ${clock}`
  if (day === addDays(today, 1)) return `${t.time.tomorrow} ${clock}`
  if (day === addDays(today, -1)) return `${t.time.yesterday} ${clock}`
  return `${dayMonth(day)}, ${clock}`
}

/** "2 soat 15 daqiqa qoldi" */
export function timeLeft(ms: number): string {
  if (ms <= 0) return t.time.expired
  if (ms < MINUTE) return t.time.lessThanMinute
  const { day, hour, minute } = t.time.units
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / MINUTE)
  if (days > 0) return t.time.left(hours > 0 ? `${days} ${day} ${hours} ${hour}` : `${days} ${day}`)
  if (hours > 0) {
    return t.time.left(minutes > 0 ? `${hours} ${hour} ${minutes} ${minute}` : `${hours} ${hour}`)
  }
  return t.time.left(`${minutes} ${minute}`)
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
