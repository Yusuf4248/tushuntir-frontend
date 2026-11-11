import {
  BellRing,
  BookOpen,
  CircleCheck,
  CircleDashed,
  CircleX,
  Home,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import type { CheckpointAnswerResult } from '@/api/types'
import { MathText } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { SardorAvatar } from './sardor-card'

/** "Eshitganim:" (voice) or "Siz yozdingiz:" (text) with the transcript. */
export function Heard({ result }: { result: Pick<CheckpointAnswerResult, 'mode' | 'transcript'> }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="text-sm font-semibold text-muted-foreground">
        {result.mode === 'voice' ? t.checkpoint.heard : t.checkpoint.youWrote}
      </p>
      <p className="mt-1 leading-relaxed">“{result.transcript}”</p>
    </div>
  )
}

export function IdeaLists({
  matched,
  missing,
  wrong = [],
}: {
  matched: string[]
  missing: string[]
  wrong?: string[]
}) {
  return (
    <div className="flex flex-col gap-4">
      {matched.length > 0 && (
        <IdeaList title={t.checkpoint.covered} ideas={matched} kind="matched" />
      )}
      {missing.length > 0 && (
        <IdeaList title={t.checkpoint.missing} ideas={missing} kind="missing" />
      )}
      {wrong.length > 0 && <IdeaList title={t.checkpoint.wrong} ideas={wrong} kind="wrong" />}
    </div>
  )
}

function IdeaList({
  title,
  ideas,
  kind,
}: {
  title: string
  ideas: string[]
  kind: 'matched' | 'missing' | 'wrong'
}) {
  const Icon = kind === 'matched' ? CircleCheck : kind === 'missing' ? CircleDashed : CircleX
  const color =
    kind === 'matched' ? 'text-success' : kind === 'missing' ? 'text-warning' : 'text-danger'
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {ideas.map((idea) => (
          <li key={idea} className="flex items-start gap-2 text-sm leading-relaxed">
            <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden />
            <MathText text={idea} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TeacherNotified() {
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-info"
    >
      <BellRing className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t.checkpoint.teacherNotified}
    </p>
  )
}

type NotYetProps = {
  result: CheckpointAnswerResult
  topicId: number
  onRetry: () => void
  retrying: boolean
}

export function NotYetView({ result, topicId, onRetry, retrying }: NotYetProps) {
  const notified = result.teacherNotified || result.masteryStatus === 'needs_help'
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SardorAvatar />
        <h2 className="text-xl leading-snug font-bold text-balance">{t.checkpoint.notYetTitle}</h2>
      </div>
      <Heard result={result} />
      {result.feedback && (
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <MathText text={result.feedback} className="block leading-relaxed" />
        </div>
      )}
      <IdeaLists
        matched={result.matchedIdeas}
        missing={result.missingIdeas}
        wrong={result.wrongStatements}
      />
      {notified && <TeacherNotified />}
      <div className="flex flex-col gap-3">
        <Button size="lg" block onClick={onRetry} loading={retrying}>
          {!retrying && <RotateCcw aria-hidden />}
          {t.checkpoint.retry}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <Link to={paths.chat(topicId)}>
              <Sparkles aria-hidden />
              {t.checkpoint.learnWithAi}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={paths.topic(topicId)}>
              <BookOpen aria-hidden />
              {t.checkpoint.readTextbook}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PassedView({ result }: { result: CheckpointAnswerResult }) {
  return (
    <div className="relative flex flex-col items-center gap-5 text-center">
      <Confetti />
      <SardorAvatar happy className="size-20 text-4xl" />
      <div className="w-full rounded-2xl border bg-card p-4 text-left shadow-card">
        <p className="text-lg font-semibold">{t.checkpoint.passedSardor}</p>
        {result.feedback && (
          <MathText
            text={result.feedback}
            className="mt-1 block leading-relaxed text-muted-foreground"
          />
        )}
      </div>
      <p className="rounded-full bg-success-soft px-5 py-2 text-xl font-bold text-success">
        {t.checkpoint.passedTitle}
      </p>
      <div className="w-full text-left">
        <Heard result={result} />
      </div>
      {result.matchedIdeas.length > 0 && (
        <div className="w-full text-left">
          <IdeaLists matched={result.matchedIdeas} missing={[]} />
        </div>
      )}
      <div className="flex w-full flex-col gap-3">
        {result.nextTopic && (
          <>
            <p className="font-medium">{t.checkpoint.nextUnlocked(result.nextTopic.title)}</p>
            <Button asChild size="lg" block>
              <Link to={paths.topic(result.nextTopic.topicId)}>{t.checkpoint.toNextTopic}</Link>
            </Button>
          </>
        )}
        <Button asChild variant="outline" size="lg" block>
          <Link to={paths.home}>
            <Home aria-hidden />
            {t.checkpoint.toHome}
          </Link>
        </Button>
      </div>
    </div>
  )
}

/** A short burst of falling pieces; hidden when the user prefers reduced motion. */
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  const colors = ['bg-primary', 'bg-warning', 'bg-info', 'bg-danger', 'bg-success']
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden"
    >
      {pieces.map((i) => (
        <span
          key={i}
          className={`absolute top-[-5%] block h-3 w-2 rounded-sm opacity-90 ${colors[i % colors.length]}`}
          style={{
            left: `${(i * 37) % 100}%`,
            animation: `confetti-fall ${1.6 + ((i * 7) % 10) / 10}s ease-in ${((i * 13) % 10) / 20}s forwards`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/** "Tinglayapman..." first, then "Tekshiryapman..." while the answer is judged. */
export function Judging({ voice }: { voice: boolean }) {
  const [checking, setChecking] = useState(!voice)
  useEffect(() => {
    if (!voice) return
    const id = window.setTimeout(() => setChecking(true), 2500)
    return () => window.clearTimeout(id)
  }, [voice])

  return (
    <div
      className="flex flex-col items-center gap-4 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="text-lg font-semibold">
        {checking ? t.checkpoint.checking : t.checkpoint.listening}
      </p>
    </div>
  )
}
