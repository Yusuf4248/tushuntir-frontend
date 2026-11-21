/**
 * Quick design check (no AI): renders screens of the local dev server (http://localhost:5174, built
 * with VITE_API_URL=https://api.tushuntir.uz/api) on each device profile in design.config.ts and
 * checks each screen for:
 * - console errors and failed API requests,
 * - horizontal overflow, and text cut off without a tooltip,
 * - touch devices: tap targets under 44px, and text fields under 16px (iOS zooms in on those),
 * - phones: an on-screen keyboard (simulated by shortening the viewport, as Android does with
 *   interactive-widget=resizes-content) must leave the focused field visible and uncovered.
 * Screenshots go to ../screenshots/design as <screen>-<device>.png.
 * Run: SCREENS=login,dashboard npm run e2e:design -- --project=iphone-14
 *
 * The production API only allows its own origin, so API calls from the test browser go through a
 * Playwright proxy that adds the CORS headers; the app itself is unchanged.
 */
import { expect, test, type BrowserContext } from '@playwright/test'
import { mkdirSync } from 'node:fs'

// @ts-expect-error -- plain ES module shared with the fixture script
import { loadCredentials } from './credentials.mjs'

const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5174'
const API = process.env.E2E_API_URL ?? 'https://api.tushuntir.uz/api'
const OUT = process.env.DESIGN_OUT ?? '/Users/macbook/Desktop/hackathon/screenshots/design'
const SCREENS = (process.env.SCREENS ?? 'login,dashboard,quiz,chat,checkpoint').split(',')
const EXPECTED = [/\/me\/chat\/sessions\?topicId=.* 404/]
const MIN_TARGET = 44

const { phone, password } = loadCredentials() as { phone: string; password: string }
type Problem = { page: string; issue: string }

/** Answers the API's CORS checks for the dev-server origin and forwards everything else. */
async function proxyApi(context: BrowserContext) {
  const origin = new URL(BASE).origin
  await context.route(`${API}/**`, async (route) => {
    const request = route.request()
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      vary: 'Origin',
    }
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          ...cors,
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE',
          'access-control-allow-headers':
            (await request.headerValue('access-control-request-headers')) ?? '*',
          'access-control-max-age': '600',
        },
      })
      return
    }
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), ...cors } })
  })
}

test('design check', async ({ page, context }, testInfo) => {
  const device = testInfo.project.name
  const touch = Boolean(testInfo.project.use.hasTouch)
  const phoneSized = touch && (page.viewportSize()?.width ?? 0) < 768
  const problems: Problem[] = []
  // Coverage gaps (missing demo data): printed, not failures.
  const notes: string[] = []
  const shots: string[] = []
  let keyboardFields = 0
  let current = 'start'
  const at = (name: string) => (current = `${name} @${device}`)

  mkdirSync(OUT, { recursive: true })
  await proxyApi(context)
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

  async function audit(name: string, opts: { keyboard?: boolean } = {}) {
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
    await page.waitForTimeout(700)
    const label = `${name} @${device}`
    const layout = await page.evaluate(
      ({ touch, minTarget }) => {
        const doc = document.documentElement
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && style.visibility !== 'hidden'
        }

        const cut: string[] = []
        for (const el of document.querySelectorAll<HTMLElement>(
          'h1,h2,h3,p,a,button,span,label,li',
        )) {
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
          // Cut horizontally (truncate) or vertically (line-clamp) without a tooltip.
          const cutX = el.scrollWidth > el.clientWidth + 1
          const cutY = style.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 2
          if ((cutX || cutY) && !el.title && !el.closest('[title]')) cut.push(text.slice(0, 60))
        }

        const small: string[] = []
        const tinyText: string[] = []
        if (touch) {
          const targets = document.querySelectorAll<HTMLElement>(
            'a[href], button, [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], [role="menuitem"], input:not([type="hidden"]), select, textarea, summary',
          )
          for (const el of targets) {
            if (el.closest('[aria-hidden="true"], [inert]') || !visible(el)) continue
            let box = el.getBoundingClientRect()
            // A visually hidden native control is tapped through its label.
            if (box.width <= 2 || box.height <= 2 || getComputedStyle(el).opacity === '0') {
              const owner = el.closest('label')
              if (!owner) continue
              box = owner.getBoundingClientRect()
            }
            // Links inside running text are exempt (WCAG 2.5.8 inline exception).
            const parentText = el.parentElement?.innerText.trim() ?? ''
            if (
              el.tagName === 'A' &&
              getComputedStyle(el).display === 'inline' &&
              parentText.length > el.innerText.trim().length + 10
            )
              continue
            if (box.width < minTarget - 0.5 || box.height < minTarget - 0.5) {
              const name =
                el.getAttribute('aria-label') ??
                el.innerText.trim().split('\n')[0] ??
                el.tagName.toLowerCase()
              small.push(
                `"${(name || el.tagName.toLowerCase()).slice(0, 40)}" ${Math.round(box.width)}×${Math.round(box.height)}`,
              )
            }
          }
          for (const el of document.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select',
          )) {
            if (!visible(el)) continue
            const size = parseFloat(getComputedStyle(el).fontSize)
            if (size < 16) tinyText.push(`${el.getAttribute('aria-label') ?? el.tagName} ${size}px`)
          }
        }
        return {
          overflow: doc.scrollWidth - doc.clientWidth,
          cut: [...new Set(cut)].slice(0, 6),
          small: [...new Set(small)],
          tinyText,
        }
      },
      { touch, minTarget: MIN_TARGET },
    )
    if (layout.overflow > 0)
      problems.push({ page: label, issue: `horizontal overflow ${layout.overflow}px` })
    for (const text of layout.cut)
      problems.push({ page: label, issue: `text cut without tooltip: "${text}"` })
    for (const target of layout.small)
      problems.push({ page: label, issue: `tap target under ${MIN_TARGET}px: ${target}` })
    for (const field of layout.tinyText)
      problems.push({ page: label, issue: `text field under 16px (iOS zooms in): ${field}` })

    const file = `${name}-${device}.png`
    await page.screenshot({ path: `${OUT}/${file}`, fullPage: true })
    shots.push(file)

    if (opts.keyboard && phoneSized) await keyboardCheck(label)
  }

  /** Each text field, focused with ~40% of the screen taken by a keyboard: visible and on top. */
  async function keyboardCheck(label: string) {
    const size = page.viewportSize()
    if (!size) return
    const fields = page.locator(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):visible, textarea:visible',
    )
    const count = await fields.count()
    keyboardFields += count
    await page.setViewportSize({ width: size.width, height: Math.round(size.height * 0.6) })
    try {
      for (let i = 0; i < count; i++) {
        const field = fields.nth(i)
        await field.focus()
        await page.waitForTimeout(300)
        const covered = await field.evaluate((el) => {
          const r = el.getBoundingClientRect()
          if (r.bottom > window.innerHeight || r.top < 0) return 'outside the visible area'
          const x = r.left + Math.min(r.width / 2, 24)
          const y = r.top + r.height / 2
          const top = document.elementFromPoint(x, y)
          if (top && top !== el && !el.contains(top) && !top.contains(el)) {
            const by = top.closest('nav, footer, header, [role="dialog"]') ?? top
            return `covered by <${by.tagName.toLowerCase()}${by.getAttribute('aria-label') ? ` "${by.getAttribute('aria-label')}"` : ''}>`
          }
          return null
        })
        if (covered) {
          const name =
            (await field.getAttribute('aria-label')) ??
            (await field.getAttribute('placeholder')) ??
            `field ${i + 1}`
          problems.push({ page: label, issue: `keyboard open: "${name}" is ${covered}` })
        }
      }
    } finally {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.setViewportSize(size)
    }
  }

  async function login() {
    await page.goto(`${BASE}/login`)
    await page
      .getByLabel(/Telefon raqami/)
      .fill(phone.replace(/\D/g, '').replace(/^998(?=\d{9}$)/, ''))
    await page.locator('input[autocomplete="current-password"]').fill(password)
    await page.getByRole('button', { name: 'Kirish' }).click()
    await page.getByRole('heading', { name: /^Salom, / }).waitFor({ timeout: 30_000 })
  }

  if (SCREENS.includes('login')) {
    at('login')
    await page.goto(`${BASE}/login`)
    await audit('login', { keyboard: true })
  }
  const masteryPromise = page
    .waitForResponse((r) => r.url() === `${API}/me/mastery` && r.status() === 200)
    .then((r) => r.json() as Promise<{ topics: { topicId: number; title: string }[] }>)
  await login()
  const mastery = await masteryPromise.catch(() => ({ topics: [] }))

  if (SCREENS.includes('dashboard')) {
    at('dashboard')
    await audit('dashboard')
    // The longest Uzbek topic title: list and topic page.
    const longest = [...mastery.topics].sort((a, b) => b.title.length - a.title.length)[0]
    at('topics')
    await page.goto(`${BASE}/topics`)
    await audit('topics')
    if (longest) {
      at('topic-longest')
      await page.goto(`${BASE}/topics/${longest.topicId}`)
      await page.getByRole('heading', { name: longest.title }).waitFor({ timeout: 20_000 })
      await audit('topic-longest')
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
      await audit('quiz-question', { keyboard: true })
      await page.getByRole('button', { name: /^Yordam/ }).click()
      await page.getByRole('dialog').waitFor()
      await audit('quiz-hints')
      await page.keyboard.press('Escape')
    } else notes.push('no open attempt: question screen not checked (set PRACTICE_START)')
    if (finished) {
      await page.goto(`${BASE}/attempts/${finished.id}/result`)
      await page.getByText('Savollar').first().waitFor({ timeout: 20_000 })
      await audit('quiz-result')
      await page.goto(`${BASE}/attempts/${finished.id}/review`)
      await page.locator('article').first().waitFor({ timeout: 60_000 })
      await audit('quiz-review', { keyboard: true })
    } else notes.push('no finished attempt with mistakes: result and review not checked')
  }

  if (SCREENS.includes('chat') && mastery.topics[0]) {
    // The chat page and its message box (opening it calls no AI; sending would).
    at('chat')
    await page.goto(`${BASE}/chat/${mastery.topics[0].topicId}`)
    await page.locator('textarea').first().waitFor({ timeout: 20_000 })
    await audit('chat', { keyboard: true })
  }

  if (SCREENS.includes('checkpoint')) {
    at('checkpoint')
    const topicId = Number(process.env.CHECKPOINT_TOPIC ?? mastery.topics[0]?.topicId ?? 0)
    await page.goto(`${BASE}/checkpoint/${topicId}`)
    await page
      .getByRole('button', { name: /^(Boshlash|Davom ettirish)/ })
      .waitFor({ timeout: 20_000 })
    await audit('checkpoint-intro')
  }

  console.log(`[${device}] screenshots in ${OUT}: ${shots.join(', ')}`)
  if (phoneSized) console.log(`[${device}] keyboard check: ${keyboardFields} text field(s)`)
  for (const note of notes) console.log(`NOTE [${device}] ${note}`)
  for (const p of problems) console.log(`PROBLEM [${p.page}] ${p.issue}`)
  expect(problems, 'design check problems').toEqual([])
})
