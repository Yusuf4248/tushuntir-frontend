import { ArrowRight, MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router'

import { useMastery } from '@/api/me'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

/** Next step for a topic whose latest quiz is ≥ 80% but not yet mastered: the checkpoint. */
export function CheckpointCard() {
  const mastery = useMastery()
  const topic = mastery.data?.topics.find((m) => m.status === 'in_progress')
  if (!topic) return null

  return (
    <article className="mt-4 rounded-xl border border-info/25 bg-info-soft/60 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-info">
        <MessageCircleMore className="size-4" aria-hidden />
        {t.home.nextStep}
      </p>
      <h2 className="mt-2 text-lg leading-snug font-bold">{topic.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.home.checkpointReady}</p>
      <Button asChild block className="mt-4">
        <Link to={paths.checkpoint(topic.topicId)}>
          {t.home.checkpointButton}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  )
}
