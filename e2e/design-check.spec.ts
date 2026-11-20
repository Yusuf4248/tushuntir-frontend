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
const EXPECTED = [/\/me\/chat\/sessions\?topicId=.* 404/]

const { phone, password } = loadCredentials() as { phone: string; password: string }
type Problem = { page: string; issue: string }
const problems: Problem[] = []
const shots: string[] = []

async function audit(page: Page, name: string, width: number) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
  await page.waitForTimeout(700)
  const label = `${name} @${width}`
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
    return { overflow: doc.scrollWidth - doc.clientWidth, cut: [...new Set(cut)].slice(0, 6) }
  })
  if (layout.overflow > 0)
    problems.push({ page: label, issue: `horizontal overflow ${layout.overflow}px` })
  for (const text of layout.cut)
    problems.push({ page: label, issue: `text cut without tooltip: "${text}"` })
  const file = `${name}-${width}.png`
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true })
  shots.push(file)
}

async function openBrowser(width: number) {
  const browser = await chromium.launch({ args: ['--disable-web-security'] })
  const context = await browser.newContext({
    viewport: { width, height: width >= 1024 ? 900 : 812 },
    deviceScaleFactor: width >= 1024 ? 1 : 2,
    locale: 'uz-UZ',
    timezoneId: 'Asia/Tashkent',
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
  return { browser, page, at: (name: string) => (current = `${name} @${width}`) }
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
  for (const width of WIDTHS) {
    const { browser, page, at } = await openBrowser(width)
    try {
      if (SCREENS.includes('login')) {
        at('login')
        await page.goto(`${BASE}/login`)
        await audit(page, 'login', width)
      }
      const masteryPromise = apiGet<{ topics: { topicId: number; title: string }[] }>(
        page,
        '/me/mastery',
      )
      await login(page)
      const mastery = await masteryPromise.catch(() => ({ topics: [] }))

      if (SCREENS.includes('dashboard')) {
        at('dashboard')
        await audit(page, 'dashboard', width)
        // The longest Uzbek topic title: list and topic page.
        const longest = [...mastery.topics].sort((a, b) => b.title.length - a.title.length)[0]
        at('topics')
        await page.goto(`${BASE}/topics`)
        await audit(page, 'topics', width)
        if (longest) {
          at('topic-longest')
          await page.goto(`${BASE}/topics/${longest.topicId}`)
          await page.getByRole('heading', { name: longest.title }).waitFor({ timeout: 20_000 })
          await audit(page, 'topic-longest', width)
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
        const open = attempts.find((a) => a.kind !== 'checkpoint' && !a.finishedAt)
        if (open) {
          await page.goto(`${BASE}/attempts/${open.id}`)
          await page
            .getByText(/1-savol|2-savol/)
            .first()
            .waitFor({ timeout: 20_000 })
          await audit(page, 'quiz-question', width)
          await page.getByRole('button', { name: /^Yordam/ }).click()
          await page.getByRole('dialog').waitFor()
          await audit(page, 'quiz-hints', width)
          await page.keyboard.press('Escape')
        } else
          problems.push({
            page: `quiz @${width}`,
            issue: 'no open attempt: question screen not checked',
          })
        if (finished) {
          await page.goto(`${BASE}/attempts/${finished.id}/result`)
          await page.getByText('Savollar').first().waitFor({ timeout: 20_000 })
          await audit(page, 'quiz-result', width)
          await page.goto(`${BASE}/attempts/${finished.id}/review`)
          await page.locator('article').first().waitFor({ timeout: 60_000 })
          await audit(page, 'quiz-review', width)
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
        await audit(page, 'checkpoint-intro', width)
      }
    } finally {
      await browser.close()
    }
  }
  console.log(`screenshots in ${OUT}: ${shots.join(', ')}`)
  for (const p of problems) console.log(`PROBLEM [${p.page}] ${p.issue}`)
  expect(problems, 'design check problems').toEqual([])
})
