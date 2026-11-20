// Builds the voice fixtures for today's checkpoint topic:
//   1. logs in to the production API (read-only requests),
//   2. picks the topic of today's task (open lesson quiz), else the next unmastered topic,
//   3. writes good.wav (a correct explanation built from the topic's key ideas) and bad.wav
//      (an off-topic answer) with edge-tts (uz-UZ-SardorNeural) + ffmpeg, 16 kHz mono,
//   4. writes fixtures/topic.json for the spec.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROD, loadCredentials } from './credentials.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fixtures = join(here, 'fixtures')
const venv = join(here, '.venv')
const edgeTts = join(venv, 'bin', 'edge-tts')
const VOICE = 'uz-UZ-SardorNeural'

function ensureEdgeTts() {
  if (existsSync(edgeTts)) return
  console.log('Installing edge-tts into e2e/.venv …')
  execFileSync('python3', ['-m', 'venv', venv], { stdio: 'inherit' })
  execFileSync(
    join(venv, 'bin', 'pip'),
    ['install', '--quiet', '-r', join(here, 'requirements.txt')],
    {
      stdio: 'inherit',
    },
  )
}

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${PROD.api}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

function synthesize(text, name) {
  const mp3 = join(fixtures, `${name}.mp3`)
  const wav = join(fixtures, `${name}.wav`)
  execFileSync(edgeTts, ['--voice', VOICE, '--text', text, '--write-media', mp3], { stdio: 'pipe' })
  // 1 s of silence before and after, so the recording starts and ends cleanly.
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-i',
    mp3,
    '-af',
    'adelay=1000|1000,apad=pad_dur=1',
    '-ar',
    '16000',
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    wav,
  ])
  rmSync(mp3)
  const seconds = Number(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      wav,
    ])
      .toString()
      .trim(),
  )
  return { file: `${name}.wav`, seconds: Math.round(seconds * 10) / 10 }
}

const { phone, password } = loadCredentials()
mkdirSync(fixtures, { recursive: true })
ensureEdgeTts()

const { accessToken } = await api('/auth/login', {
  method: 'POST',
  body: { login: phone, password },
})
const today = await api('/me/today', { token: accessToken })

// Today's task: the open quiz due soonest; else a lesson of today with a topic; else the next topic to master.
const open = [...today.quizzes].sort((a, b) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'))[0]
let topicId = open?.topic?.id ?? today.lessons.find((l) => l.quiz && l.topic)?.topic?.id ?? null
let source = open ? 'open quiz' : topicId ? "today's lesson" : null
if (!topicId) {
  const mastery = await api('/me/mastery', { token: accessToken })
  topicId =
    mastery.topics.find((t) => t.status !== 'mastered')?.topicId ?? mastery.topics[0]?.topicId
  source = 'next topic to master'
}
if (!topicId) throw new Error('No topic found for the checkpoint')
const topic = await api(`/me/topics/${topicId}`, { token: accessToken })

const goodText = [
  'Sardor, sen adashding, men senga tushuntiraman.',
  ...topic.keyIdeas,
  "Mana shu qoidalarni eslab qolsang, misollarni to'g'ri yechasan.",
].join(' ')
const badText =
  "Bilmadim. Menimcha bu mavzu ob-havo haqida. Bugun havo issiq, men futbol o'ynagani boraman."

const good = synthesize(goodText, 'good')
const bad = synthesize(badText, 'bad')

writeFileSync(
  join(fixtures, 'topic.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      voice: VOICE,
      topicId,
      topicTitle: topic.title,
      source,
      quizId: open?.topic?.id === topicId ? open.quizId : null,
      keyIdeas: topic.keyIdeas,
      good: { ...good, text: goodText },
      bad: { ...bad, text: badText },
    },
    null,
    2,
  ),
)
console.log(
  `Topic ${topicId} "${topic.title}" (${source}); good.wav ${good.seconds}s, bad.wav ${bad.seconds}s`,
)
