/**
 * Production smoke test of the student app (https://tushuntir-frontend.vercel.app).
 * Run: npm run e2e:prod  (builds the voice fixtures first). Credentials: E2E_PHONE / E2E_PASSWORD
 * from the environment or e2e/.env.local; the password is never printed or stored.
 * Uses real AI and changes demo data: run it sparingly.
 */
import { chromium, expect, test, type Browser, type Page } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// @ts-expect-error -- plain ES module shared with the fixture script
import { PROD, loadCredentials } from './credentials.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = join(here, 'report')
const FIXTURES = join(here, 'fixtures')
const VIEWPORT = { width: 375, height: 812 }

type Fixture = { file: string; seconds: number; text: string }
type TopicFixture = {
  topicId: number
  topicTitle: string
  source: string
  quizId: number | null
  good: Fixture
  bad: Fixture
}
type StepStatus = 'pass' | 'fail' | 'skip'
type StepResult = {
  n: number
  name: string
  status: StepStatus
  ms: number
  screenshot?: string
  notes: string[]
}
type RequestRow = { step: string; method: string; url: string; status: number; ms: number | null }

/** Requests that may fail by design. */
const EXPECTED_FAILURES: { method: string; pattern: RegExp; status: number; why: string }[] = [
  {
    method: 'GET',
    pattern: /\/me\/chat\/sessions\?topicId=/,
    status: 404,
    why: 'no chat session for the topic yet',
  },
]

const topic = JSON.parse(readFileSync(join(FIXTURES, 'topic.json'), 'utf8')) as TopicFixture
const { phone, password } = loadCredentials() as { phone: string; password: string }

const steps: StepResult[] = []
const requests: RequestRow[] = []
const consoleErrors: { step: string; text: string }[] = []
const timings: { label: string; ms: number; note?: string }[] = []
let currentStep = 'setup'
let stepNo = 0

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const isExpected = (r: RequestRow) =>
  EXPECTED_FAILURES.some(
    (e) => e.method === r.method && e.status === r.status && e.pattern.test(r.url),
  )

function watch(page: Page) {
  page.on('console', (m) => {
    if (m.type() === 'error')
      consoleErrors.push({ step: currentStep, text: m.text().slice(0, 300) })
  })
  page.on('pageerror', (e) =>
    consoleErrors.push({ step: currentStep, text: `pageerror: ${e.message}` }),
  )
  page.on('response', (res) => {
    if (!res.url().startsWith(PROD.api)) return
    const timing = res.request().timing()
    requests.push({
      step: currentStep,
      method: res.request().method(),
      url: res.url().replace(PROD.api, ''),
      status: res.status(),
      ms: timing.responseEnd > 0 ? Math.round(timing.responseEnd) : null,
    })
  })
  page.on('requestfailed', (req) => {
    if (!req.url().startsWith(PROD.api)) return
    requests.push({
      step: currentStep,
      method: req.method(),
      url: req.url().replace(PROD.api, ''),
      status: 0,
      ms: null,
    })
  })
}

async function newBrowser(wav: string): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${join(FIXTURES, wav)}`,
    ],
  })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'uz-UZ',
    timezoneId: 'Asia/Tashkent',
    permissions: ['microphone'],
  })
  const page = await context.newPage()
  watch(page)
  return { browser, page }
}

async function settle(page: Page, ms = 600) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined)
  await page.waitForTimeout(ms)
}

/** Runs one step: health checks after it, a screenshot always, and a row in the report. */
async function step(
  page: Page | null,
  name: string,
  fn: () => Promise<string | void>,
  opts: { skipIf?: string | false } = {},
) {
  stepNo += 1
  const n = stepNo
  currentStep = `${String(n).padStart(2, '0')} ${name}`
  const result: StepResult = { n, name, status: 'pass', ms: 0, notes: [] }
  steps.push(result)
  if (opts.skipIf) {
    result.status = 'skip'
    result.notes.push(opts.skipIf)
    return false
  }
  const errorsBefore = consoleErrors.length
  const requestsBefore = requests.length
  const t0 = Date.now()
  try {
    const note = await fn()
    if (note) result.notes.push(note)
  } catch (error) {
    result.status = 'fail'
    result.notes.push((error as Error).message.split('\n')[0]!.slice(0, 300))
  }
  result.ms = Date.now() - t0
  if (page) {
    await settle(page, 300)
    // Health: no blank screen, no crash screen, no console errors, no unexpected failed API calls.
    const text = await page
      .locator('#root')
      .innerText()
      .catch(() => '')
    if (text.trim().length < 20) fail(result, 'blank screen (#root has no text)')
    if (/Nimadir buzildi/.test(text)) fail(result, 'crash screen shown')
    const errors = consoleErrors
      .slice(errorsBefore)
      .filter((e) => !/Failed to load resource/.test(e.text))
    if (errors.length)
      fail(
        result,
        `console errors: ${errors
          .map((e) => e.text)
          .join(' | ')
          .slice(0, 300)}`,
      )
    const bad = requests
      .slice(requestsBefore)
      .filter((r) => (r.status >= 400 || r.status === 0) && !isExpected(r))
    if (bad.length)
      fail(
        result,
        `failed API requests: ${bad.map((r) => `${r.method} ${r.url} → ${r.status}`).join(', ')}`,
      )
    result.screenshot = `${String(n).padStart(2, '0')}-${slug(name)}.png`
    await page
      .screenshot({ path: join(REPORT_DIR, result.screenshot), fullPage: true })
      .catch(() => {
        result.screenshot = undefined
      })
  }
  return result.status === 'pass'
}

function fail(result: StepResult, note: string) {
  result.status = 'fail'
  result.notes.push(note)
}

async function login(page: Page) {
  await page.goto(`${PROD.app}/login`)
  const digits = phone.replace(/\D/g, '').replace(/^998(?=\d{9}$)/, '')
  await page.getByLabel(/Telefon raqami/).fill(digits)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.getByRole('button', { name: 'Kirish' }).click()
  await page.getByRole('heading', { name: /^Salom, / }).waitFor({ timeout: 30_000 })
}

/** Records with the fake microphone for the fixture's length, then sends; returns the outcome. */
async function answerByVoice(page: Page, fixture: Fixture, label: string) {
  await page.getByRole('button', { name: 'Yozish uchun bosing' }).click()
  await page.getByText('Yozilmoqda').waitFor({ timeout: 10_000 })
  await page.waitForTimeout((fixture.seconds + 1) * 1000)
  await page.getByRole('button', { name: "To'xtatish uchun bosing" }).click()
  await page.getByText('Sizning yozuvingiz').first().waitFor({ timeout: 10_000 })
  const t0 = Date.now()
  await page.getByRole('button', { name: 'Yuborish' }).click()
  await page.waitForFunction(
    () => {
      const phase = document.querySelector('[data-phase]')?.getAttribute('data-phase')
      return phase === 'follow_up' || phase === 'not_yet' || phase === 'passed'
    },
    null,
    { timeout: 150_000, polling: 250 },
  )
  const phase = (await page.locator('[data-phase]').getAttribute('data-phase')) ?? 'unknown'
  timings.push({ label: `checkpoint answer (${label})`, ms: Date.now() - t0, note: phase })
  const heard = await page
    .getByText(/Eshitganim:/)
    .locator('xpath=following-sibling::*[1]')
    .first()
    .innerText()
    .catch(() => '')
  return { phase, heard }
}

async function startCheckpoint(page: Page, label: string) {
  await page.goto(`${PROD.app}/checkpoint/${topic.topicId}`)
  const start = page.getByRole('button', { name: /^(Boshlash|Davom ettirish)/ })
  await start.waitFor({ timeout: 30_000 })
  const t0 = Date.now()
  await start.click()
  await page.getByRole('button', { name: 'Yozish uchun bosing' }).waitFor({ timeout: 90_000 })
  timings.push({ label: `checkpoint start (${label})`, ms: Date.now() - t0 })
}

function writeReport(deployedBundle: string) {
  const icon = { pass: '✅ pass', fail: '❌ fail', skip: '⏭ skip' }
  const failed = requests.filter((r) => (r.status >= 400 || r.status === 0) && !isExpected(r))
  const expected = requests.filter((r) => (r.status >= 400 || r.status === 0) && isExpected(r))
  const passCount = steps.filter((s) => s.status === 'pass').length
  const lines = [
    '# Production smoke test',
    '',
    `- Date: ${new Date().toISOString()}`,
    `- App: ${PROD.app} (bundle \`${deployedBundle}\`)`,
    `- API: ${PROD.api}`,
    `- Viewport: ${VIEWPORT.width}×${VIEWPORT.height}, Chromium (Playwright), fake microphone`,
    `- Checkpoint topic: #${topic.topicId} "${topic.topicTitle}" (${topic.source})`,
    `- Voice fixtures (uz-UZ-SardorNeural, 16 kHz mono): good.wav ${topic.good.seconds}s, bad.wav ${topic.bad.seconds}s`,
    '',
    `**Result: ${passCount}/${steps.length} steps passed.**`,
    '',
    '## Steps',
    '',
    '| # | Step | Result | Time | Screenshot | Notes |',
    '|---|---|---|---|---|---|',
    ...steps.map(
      (s) =>
        `| ${s.n} | ${s.name} | ${icon[s.status]} | ${(s.ms / 1000).toFixed(1)} s | ${s.screenshot ? `\`${s.screenshot}\`` : '—'} | ${s.notes.join('<br>').replace(/\|/g, '\\|') || ''} |`,
    ),
    '',
    '## AI and voice response times',
    '',
    '| What | Time | Outcome |',
    '|---|---|---|',
    ...timings.map((t) => `| ${t.label} | ${(t.ms / 1000).toFixed(1)} s | ${t.note ?? ''} |`),
    '',
    '## Failed API requests (status ≥ 400 or no response)',
    '',
    ...(failed.length
      ? [
          '| Step | Request | Status |',
          '|---|---|---|',
          ...failed.map(
            (r) => `| ${r.step} | \`${r.method} ${r.url}\` | ${r.status || 'no response'} |`,
          ),
        ]
      : ['None.']),
    '',
    `Expected and ignored: ${expected.length ? expected.map((r) => `\`${r.method} ${r.url}\` → ${r.status}`).join(', ') : 'none'}.`,
    '',
    '## Console errors',
    '',
    ...(consoleErrors.length ? consoleErrors.map((e) => `- [${e.step}] ${e.text}`) : ['None.']),
    '',
    `## All API requests (${requests.length})`,
    '',
    '| Step | Request | Status | ms |',
    '|---|---|---|---|',
    ...requests.map(
      (r) => `| ${r.step} | \`${r.method} ${r.url}\` | ${r.status || '—'} | ${r.ms ?? '—'} |`,
    ),
    '',
  ]
  writeFileSync(join(REPORT_DIR, 'REPORT.md'), lines.join('\n'))
}

test('production smoke: login → AI loop → school screens', async () => {
  mkdirSync(REPORT_DIR, { recursive: true })
  const browsers: Browser[] = []
  let deployedBundle = '?'
  try {
    // ----- Part 1: bad.wav on the microphone -----------------------------------------------
    const a = await newBrowser(topic.bad.file)
    browsers.push(a.browser)
    const page = a.page

    const loggedIn = await step(page, 'Login', async () => {
      await login(page)
      deployedBundle =
        (await page.locator('script[src*="/assets/index-"]').getAttribute('src'))
          ?.split('/')
          .pop() ?? '?'
    })

    let quizId: number | null = null
    await step(
      page,
      'Dashboard (today, deadlines)',
      async () => {
        await expect(page.getByText('Bugungi vazifa').first()).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Muddatlar' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Bugungi darslar' })).toBeVisible()
        // No open task: in demo mode, end a lesson so its quiz opens.
        const startLink = page
          .locator('article')
          .getByRole('link', { name: /Boshlash|Davom ettirish/ })
        if (!(await startLink.count())) {
          const demo = page.getByRole('button', { name: 'Darsni tugatish (demo)' }).first()
          if (await demo.count()) {
            await demo.click()
            await startLink.first().waitFor({ timeout: 20_000 })
            return 'no open task at first: finished a lesson with the demo button'
          }
          return 'no open quiz today ("Hozircha ochiq vazifa yo\'q")'
        }
      },
      { skipIf: !loggedIn && 'login failed' },
    )

    await step(
      page,
      "Open today's task",
      async () => {
        const startLink = page
          .locator('article')
          .getByRole('link', { name: /Boshlash|Davom ettirish/ })
          .first()
        if (!(await startLink.count())) {
          quizId = topic.quizId
          if (!quizId) throw new Error('no task on the dashboard and no quiz for the fixture topic')
          await page.goto(`${PROD.app}/quiz/${quizId}`)
        } else {
          await startLink.click()
        }
        await page.waitForURL(/\/quiz\/\d+/, { timeout: 15_000 })
        quizId = Number(page.url().match(/\/quiz\/(\d+)/)?.[1])
        await expect(page.getByText(/ta savol/).first()).toBeVisible({ timeout: 15_000 })
        return `quiz ${quizId}${topic.quizId && topic.quizId !== quizId ? ` (fixture topic's quiz is ${topic.quizId})` : ''}`
      },
      { skipIf: !loggedIn && 'login failed' },
    )

    await step(
      page,
      'Lesson textbook (topic page)',
      async () => {
        await page.goto(`${PROD.app}/topics/${topic.topicId}`)
        await expect(page.getByRole('heading', { name: 'Darslik matni' })).toBeVisible({
          timeout: 20_000,
        })
        const paragraphs = await page.locator('section[data-paragraph-id]').count()
        if (paragraphs === 0) throw new Error('no textbook paragraphs')
        return `${paragraphs} paragraphs`
      },
      { skipIf: !loggedIn && 'login failed' },
    )

    await step(
      page,
      'Select-to-ask chat ("Tushuntir")',
      async () => {
        const first = page.locator('section[data-paragraph-id]').first()
        await first.scrollIntoViewIfNeeded()
        await page.evaluate(() => {
          const p = document.querySelector('section[data-paragraph-id] p')
          const walker = p && document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
          const node = walker?.nextNode()
          if (!node?.textContent) throw new Error('no text to select')
          const end = node.textContent.indexOf('.') + 1 || node.textContent.length
          const range = document.createRange()
          range.setStart(node, 0)
          range.setEnd(node, end)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        })
        await page.getByRole('toolbar').getByRole('button', { name: 'Tushuntir' }).click()
        const before = await page.locator('[data-chat-item=assistant]').count()
        const t0 = Date.now()
        await page.waitForFunction(
          (n) => document.querySelectorAll('[data-chat-item=assistant]').length > n,
          before,
          { timeout: 90_000 },
        )
        timings.push({ label: 'chat answer (select → Tushuntir)', ms: Date.now() - t0 })
        const answer = await page.locator('[data-chat-item=assistant]').last().innerText()
        const chips = await page
          .getByRole('list', { name: 'Manbalar' })
          .last()
          .locator('li')
          .count()
          .catch(() => 0)
        if (answer.trim().length < 20) throw new Error('empty answer')
        return `answer ${answer.trim().length} chars, ${chips} source chip(s)`
      },
      { skipIf: !loggedIn && 'login failed' },
    )
    await page.keyboard.press('Escape')

    let attemptOk = false
    let usedPractice = false
    attemptOk = await step(
      page,
      'Quiz (one hint, at least one wrong answer)',
      async () => {
        await page.goto(
          quizId ? `${PROD.app}/quiz/${quizId}` : `${PROD.app}/practice/${topic.topicId}`,
        )
        const start = page.getByRole('button', { name: /^(Boshlash|Davom ettirish)/ })
        const done = page.getByText(/Bu quiz topshirilgan|Muddat tugagan|Quiz topilmadi/)
        await Promise.race([start.waitFor({ timeout: 20_000 }), done.waitFor({ timeout: 20_000 })])
        if (await done.count()) {
          usedPractice = true
          await page.goto(`${PROD.app}/practice/${topic.topicId}`)
          await start.waitFor({ timeout: 20_000 })
        }
        await start.click()
        await page.waitForURL(/\/attempts\/\d+/, { timeout: 90_000 })
        await settle(page)
        // A hint on question 1.
        await page.getByRole('button', { name: /^Yordam/ }).click()
        const t0 = Date.now()
        await page.getByRole('button', { name: "Birinchi yordamni ko'rish" }).click()
        await page.getByText('1-yordam').waitFor({ timeout: 30_000 })
        timings.push({ label: 'quiz hint (level 1)', ms: Date.now() - t0 })
        await page.keyboard.press('Escape')
        // Answer every question: short answers get a deliberately wrong "bilmayman".
        const dots = page.locator('nav[aria-label=Savollar] button')
        const count = await dots.count()
        let wrongOnPurpose = 0
        for (let i = 0; i < count; i++) {
          await dots.nth(i).click()
          await page.getByText(`${i + 1}-savol`, { exact: true }).waitFor()
          const options = page.locator('label:has(input[type=radio])')
          if (await options.count()) {
            await options.nth(i === 0 ? (await options.count()) - 1 : 0).click()
          } else {
            await page.getByLabel('Javobingiz').fill('bilmayman')
            await page.getByLabel('Javobingiz').blur()
            wrongOnPurpose += 1
          }
          await page.getByText('Saqlandi').waitFor({ timeout: 30_000 })
        }
        await page.getByRole('button', { name: 'Topshirish' }).first().click()
        const dialog = page.getByRole('alertdialog')
        if (
          await dialog
            .waitFor({ timeout: 2_000 })
            .then(() => true)
            .catch(() => false)
        ) {
          await dialog.getByRole('button', { name: 'Topshirish' }).click()
        }
        await page.waitForURL(/\/result$/, { timeout: 60_000 })
        await page.getByText('Savollar').first().waitFor()
        const score = (await page.locator('section').first().innerText()).split('\n')[0]
        const wrong = await page.getByText(/Noto'g'ri|Javob berilmagan/).count()
        if (wrong === 0) throw new Error(`no wrong answer (score ${score})`)
        return `${usedPractice ? 'practice quiz (lesson quiz already done)' : `lesson quiz ${quizId}`}; ${count} questions, ${wrongOnPurpose} wrong on purpose; result ${score}`
      },
      { skipIf: !loggedIn && 'login failed' },
    )

    await step(
      page,
      'Mistake review',
      async () => {
        await page.getByRole('link', { name: "Xatolarni ko'rib chiqish" }).click()
        const t0 = Date.now()
        await page.locator('article').first().waitFor({ timeout: 180_000 })
        timings.push({ label: 'mistake review ready', ms: Date.now() - t0 })
        const cards = await page.locator('article').count()
        const confirm = await page.getByText('Tekshiruv savoli').count()
        return `${cards} mistake card(s), ${confirm} confirmation question(s)`
      },
      { skipIf: !attemptOk && 'quiz step failed' },
    )

    await step(
      page,
      'Checkpoint with bad.wav (expect not passed)',
      async () => {
        await startCheckpoint(page, 'try with bad.wav')
        let { phase, heard } = await answerByVoice(page, topic.bad, 'bad.wav')
        if (phase === 'follow_up')
          ({ phase, heard } = await answerByVoice(page, topic.bad, 'bad.wav follow-up'))
        if (phase === 'passed') throw new Error('an off-topic answer passed the checkpoint')
        await expect(page.getByRole('button', { name: 'Qayta urinish' })).toBeVisible()
        return `outcome ${phase}; heard: "${heard.slice(0, 120)}"`
      },
      { skipIf: !loggedIn && 'login failed' },
    )
    await a.browser.close()

    // ----- Part 2: good.wav on the microphone ----------------------------------------------
    const b = await newBrowser(topic.good.file)
    browsers.push(b.browser)
    const page2 = b.page
    currentStep = 'login (good.wav browser)'
    await login(page2)

    await step(page2, 'Checkpoint with good.wav (expect pass)', async () => {
      await startCheckpoint(page2, 'try with good.wav')
      let { phase, heard } = await answerByVoice(page2, topic.good, 'good.wav')
      if (phase === 'follow_up')
        ({ phase, heard } = await answerByVoice(page2, topic.good, 'good.wav follow-up'))
      if (phase !== 'passed')
        throw new Error(`expected passed, got ${phase}; heard: "${heard.slice(0, 160)}"`)
      await expect(page2.getByText("O'zlashtirildi ✅")).toBeVisible()
      const next = await page2
        .getByText(/Keyingi mavzu ochildi/)
        .innerText()
        .catch(() => '')
      return `passed; ${next || 'no next topic shown'}`
    })

    for (const [path, name, heading] of [
      ['/timetable', 'Timetable', 'Dars jadvali'],
      ['/homework', 'Homework', 'Uy vazifalari'],
      ['/grades', 'Grades', 'Baholar'],
      ['/attendance', 'Attendance', 'Davomat'],
      ['/notifications', 'Notifications', 'Bildirishnomalar'],
      ['/profile', 'Profile', 'Profil'],
    ] as const) {
      await step(page2, name, async () => {
        await page2.goto(`${PROD.app}${path}`)
        await settle(page2, 1500)
        if (await page2.getByText('Sahifa topilmadi').count()) {
          throw new Error(`${path} shows the 404 page: this screen is not in the deployed build`)
        }
        await expect(page2.getByRole('heading', { name: heading }).first()).toBeVisible({
          timeout: 15_000,
        })
      })
    }
  } finally {
    for (const browser of browsers) await browser.close().catch(() => undefined)
    writeReport(deployedBundle)
  }

  const failedSteps = steps.filter((s) => s.status === 'fail').map((s) => `${s.n}. ${s.name}`)
  expect(failedSteps, 'failed steps (see e2e/report/REPORT.md)').toEqual([])
})
