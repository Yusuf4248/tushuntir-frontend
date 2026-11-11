import { Dumbbell, ListChecks, MessageCircleMore, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useQuizzes } from '@/api/me'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

type TopicActionsProps = {
  topicId: number
  /** Opens the chat in place (sheet or side panel); without it, links to /chat/:topicId. */
  onOpenChat?: () => void
}

export function TopicActions({ topicId, onOpenChat }: TopicActionsProps) {
  const quizzes = useQuizzes()
  const openQuiz = quizzes.data?.available.find((q) => q.topic?.id === topicId)

  const chatTile = (
    <TileBody icon={Sparkles} title={t.topicPage.learnWithAi} hint={t.topicPage.learnWithAiHint} />
  )

  return (
    <nav aria-label={t.topicPage.actions} className="grid grid-cols-2 gap-3">
      {onOpenChat ? (
        <button type="button" onClick={onOpenChat} className={tileClass(true, 'col-span-2')}>
          {chatTile}
        </button>
      ) : (
        <Link to={paths.chat(topicId)} className={tileClass(true, 'col-span-2')}>
          {chatTile}
        </Link>
      )}
      {openQuiz && (
        <Link to={paths.quiz(openQuiz.quizId)} className={tileClass(false)}>
          <TileBody icon={ListChecks} title={t.topicPage.quiz} />
        </Link>
      )}
      <Link to={paths.practice(topicId)} className={tileClass(false)}>
        <TileBody icon={Dumbbell} title={t.topicPage.practice} />
      </Link>
      <Link
        to={paths.checkpoint(topicId)}
        className={tileClass(false, openQuiz ? 'col-span-2' : undefined)}
      >
        <TileBody icon={MessageCircleMore} title={t.topicPage.explain} />
      </Link>
    </nav>
  )
}

function tileClass(primary: boolean, extra?: string) {
  return cn(
    'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-card transition-colors',
    primary
      ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary-hover'
      : 'bg-card hover:bg-muted',
    extra,
  )
}

function TileBody({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint?: ReactNode
}) {
  return (
    <>
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {hint && <span className="block text-sm opacity-85">{hint}</span>}
      </span>
    </>
  )
}
