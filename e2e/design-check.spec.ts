/**
 * Quick design check (no AI): renders screens of the local dev server (http://localhost:5174, built
 * with VITE_API_URL=https://api.tushuntir.uz/api) at 375 and 1440 px and checks each one for
 * console errors, failed API requests, horizontal overflow and text cut off without a tooltip.
 * Screenshots go to ../screenshots/design. Run: SCREENS=login,dashboard npm run e2e:design
 *
 * The production API only allows its own origin, so this test browser runs with web security
 * off; the app itself is unchanged.
 */
import { chromium, expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

// @ts-expect-error -- plain ES module shared with the fixture script
import { loadCredentials } from './credentials.mjs'

const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5174'
const API = process.env.E2E_API_URL ?? 'https://api.tushuntir.uz/api'
const OUT = process.env.DESIGN_OUT ?? '/Users/macbook/Desktop/hackathon/screenshots/design'
const SCREENS = (process.env.SCREENS ?? 'login,dashboard,quiz,checkpoint').split(',')
const WIDTHS = [375, 1440]
// Both themes by default; dark runs through the system setting (the app's default choice).
const THEMES = (process.env.THEMES ?? 'light,dark').split(',') as ('light' | 'dark')[]
const EXPECTED = [/\/me\/chat\/sessions\?topicId=.* 404/]

const { phone, password } = loadCredentials() as { phone: string; password: string }
type Problem = { page: string; issue: string }
const problems: Problem[] = []
const shots: string[] = []

async function audit(page: Page, name: string, width: number, theme: 'light' | 'dark') {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
  await page.waitForTimeout(700)
  const suffix = theme === 'dark' ? '-dark' : ''
  const label = `${name} @${width}${suffix}`
  const layout = await page.evaluate(() => {
    const doc = document.documentElement
    const cut: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,button,span,label,li')) {
      const style = getComputedStyle(el)
      const clips =
        style.overflow === 'hidden' ||
        style.textOverflow === 'ellipsis' ||
        style.overflowX === 'hidden'
      if (!clips || el.children.length > 2) continue
      // Screen-reader-only text is clipped on purpose.
      if (el.classList.contains('sr-only') || el.getBoundingClientRect().width <= 1) continue
      const text = el.innerText.trim()
      if (!text) continue
      // Cut horizontally (truncate) or vertically (line-clamp) without a tooltip to read the rest.
      const cutX = el.scrollWidth > el.clientWidth + 1
      const cutY = style.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 2
      if ((cutX || cutY) && !el.title && !el.closest('[title]')) cut.push(text.slice(0, 60))
    }

    // Text contrast against the real background behind it (4.5:1, large text 3:1).
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (color: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return [r!, g!, b!, a! / 255]
    }
    const over = (top: number[], bottom: number[]) =>
      [0, 1, 2].map((i) => top[i]! * top[3]! + bottom[i]! * (1 - top[3]!))
    const backgroundOf = (el: Element): number[] => {
      const layers: number[][] = []
      for (let node: Element | null = el; node; node = node.parentElement) {
        const color = rgba(getComputedStyle(node).backgroundColor)
        if (color[3] > 0) layers.push(color)
        if (color[3] >= 1) break
      }
      let result = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3)
      for (const layer of layers.reverse()) result = over(layer, result)
      return result
    }
    const luminance = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const x = v / 255
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
    }
    const hex = (c: number[]) =>
      '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    const lowContrast: string[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set<Element>()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement
      if (!el || seen.has(el) || !node.textContent?.trim()) continue
      seen.add(el)
      if (el.closest('svg, .sr-only, [disabled], [aria-disabled="true"]')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width <= 1 || rect.height <= 1) continue
      let opacity = 1
      for (let n: Element | null = el; n; n = n.parentElement)
        opacity *= Number(getComputedStyle(n).opacity)
      if (opacity < 0.99) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden') continue
      const bg = backgroundOf(el)
      const fg = over(rgba(style.color), bg)
      const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
      const ratio = (hi! + 0.05) / (lo! + 0.05)
      const size = parseFloat(style.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5))
        lowContrast.push(
          `${ratio.toFixed(2)}:1 "${node.textContent.trim().slice(0, 40)}" (${hex(fg)} on ${hex(bg)})`,
        )
    }

    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      cut: [...new Set(cut)].slice(0, 6),
      lowContrast: [...new Set(lowContrast)].slice(0, 8),
    }
  })
  if (layout.overflow > 0)
    problems.push({ page: label, issue: `horizontal overflow ${layout.overflow}px` })
  for (const text of layout.cut)
    problems.push({ page: label, issue: `text cut without tooltip: "${text}"` })
  for (const text of layout.lowContrast)
    problems.push({ page: label, issue: `low contrast ${text}` })
  const file = `${name}-${width}${suffix}.png`
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true })
  shots.push(file)
}

async function openBrowser(width: number, theme: 'light' | 'dark') {
  const browser = await chromium.launch({ args: ['--disable-web-security'] })
  const context = await browser.newContext({
    viewport: { width, height: width >= 1024 ? 900 : 812 },
    deviceScaleFactor: width >= 1024 ? 1 : 2,
    locale: 'uz-UZ',
    timezoneId: 'Asia/Tashkent',
    colorScheme: theme,
  })
  const page = await context.newPage()
  let current = 'start'
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
      problems.push({ page: current, issue: `console error: ${m.text().slice(0, 200)}` })
    }
  })
  page.on('pageerror', (e) => problems.push({ page: current, issue: `page error: ${e.message}` }))
  page.on('response', (res) => {
    if (!res.url().startsWith(API) || res.status() < 400) return
    const line = `${res.request().method()} ${res.url().replace(API, '')} ${res.status()}`
    if (!EXPECTED.some((re) => re.test(line)))
      problems.push({ page: current, issue: `API ${line}` })
  })
  const suffix = theme === 'dark' ? '-dark' : ''
  return { browser, page, at: (name: string) => (current = `${name} @${width}${suffix}`) }
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page
    .getByLabel(/Telefon raqami/)
    .fill(phone.replace(/\D/g, '').replace(/^998(?=\d{9}$)/, ''))
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.getByRole('button', { name: 'Kirish' }).click()
  await page.getByRole('heading', { name: /^Salom, / }).waitFor({ timeout: 30_000 })
}

/** JSON from the API with the page's session (the access token lives in the app's memory). */
async function apiGet<T>(page: Page, path: string): Promise<T> {
  const response = page.waitForResponse((r) => r.url() === `${API}${path}` && r.status() === 200)
  return (await response).json() as Promise<T>
}

test('design check', async () => {
  mkdirSync(OUT, { recursive: true })
  for (const theme of THEMES)
    for (const width of WIDTHS) {
      const { browser, page, at } = await openBrowser(width, theme)
      try {
        if (SCREENS.includes('login')) {
          at('login')
          await page.goto(`${BASE}/login`)
          await audit(page, 'login', width, theme)
        }
        const masteryPromise = apiGet<{ topics: { topicId: number; title: string }[] }>(
          page,
          '/me/mastery',
        )
        await login(page)
        const mastery = await masteryPromise.catch(() => ({ topics: [] }))

        if (SCREENS.includes('dashboard')) {
          at('dashboard')
          await audit(page, 'dashboard', width, theme)
          // The longest Uzbek topic title: list and topic page.
          const longest = [...mastery.topics].sort((a, b) => b.title.length - a.title.length)[0]
          at('topics')
          await page.goto(`${BASE}/topics`)
          await audit(page, 'topics', width, theme)
          if (longest) {
            at('topic-longest')
            await page.goto(`${BASE}/topics/${longest.topicId}`)
            await page.getByRole('heading', { name: longest.title }).waitFor({ timeout: 20_000 })
            await audit(page, 'topic-longest', width, theme)
          }
        }

        if (SCREENS.includes('quiz')) {
          at('quiz')
          // Existing attempts only: a finished one for result + review, an open one for questions.
          const history = page.waitForResponse(
            (r) => r.url().startsWith(`${API}/me/attempts`) && r.status() === 200,
          )
          await page.goto(`${BASE}/profile`)
          const attempts = (await (await history).json()) as {
            id: number
            kind: string
            finishedAt: string | null
            scorePercent: number | null
          }[]
          const finished = attempts.find(
            (a) => a.kind !== 'checkpoint' && a.finishedAt && (a.scorePercent ?? 100) < 100,
          )
          let open = attempts.find((a) => a.kind !== 'checkpoint' && !a.finishedAt)
          // With PRACTICE_START=<topicId>, start one practice quiz (existing questions, no AI) so the
          // question screen can be checked; later runs reuse it while it stays open.
          if (!open && process.env.PRACTICE_START) {
            await page.goto(`${BASE}/practice/${process.env.PRACTICE_START}`)
            await page.getByRole('button', { name: 'Boshlash' }).click()
            await page.waitForURL(/\/attempts\/\d+/, { timeout: 60_000 })
            open = {
              id: Number(page.url().match(/attempts\/(\d+)/)?.[1]),
              kind: 'practice',
              finishedAt: null,
              scorePercent: null,
            }
          }
          if (open) {
            await page.goto(`${BASE}/attempts/${open.id}`)
            await page
              .getByText(/1-savol|2-savol/)
              .first()
              .waitFor({ timeout: 20_000 })
            await audit(page, 'quiz-question', width, theme)
            await page.getByRole('button', { name: /^Yordam/ }).click()
            await page.getByRole('dialog').waitFor()
            await audit(page, 'quiz-hints', width, theme)
            await page.keyboard.press('Escape')
          } else
            problems.push({
              page: `quiz @${width}`,
              issue: 'no open attempt: question screen not checked',
            })
          if (finished) {
            await page.goto(`${BASE}/attempts/${finished.id}/result`)
            await page.getByText('Savollar').first().waitFor({ timeout: 20_000 })
            await audit(page, 'quiz-result', width, theme)
            await page.goto(`${BASE}/attempts/${finished.id}/review`)
            await page.locator('article').first().waitFor({ timeout: 60_000 })
            await audit(page, 'quiz-review', width, theme)
          } else
            problems.push({
              page: `quiz @${width}`,
              issue: 'no finished attempt with mistakes: review not checked',
            })
        }

        if (SCREENS.includes('checkpoint')) {
          at('checkpoint')
          const topicId = Number(process.env.CHECKPOINT_TOPIC ?? mastery.topics[0]?.topicId ?? 0)
          await page.goto(`${BASE}/checkpoint/${topicId}`)
          await page
            .getByRole('button', { name: /^(Boshlash|Davom ettirish)/ })
            .waitFor({ timeout: 20_000 })
          await audit(page, 'checkpoint-intro', width, theme)
        }
      } finally {
        await browser.close()
      }
    }
  console.log(`screenshots in ${OUT}: ${shots.join(', ')}`)
  for (const p of problems) console.log(`PROBLEM [${p.page}] ${p.issue}`)
  expect(problems, 'design check problems').toEqual([])
})
