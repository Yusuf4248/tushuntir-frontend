import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { useMastery } from '@/api/me'
import { Sardor } from '@/components/sardor'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { paths } from '@/routes/paths'

/** Next step for a topic whose latest quiz is ≥ 80% but not yet mastered: the checkpoint. */
export function CheckpointCard() {
  const mastery = useMastery()
  const topic = mastery.data?.topics.find((m) => m.status === 'in_progress')
  if (!topic) return null

  return (
    <article className="mt-4 rounded-2xl border-2 border-ink bg-katak p-4 sm:p-5">
      <p className="text-sm font-semibold text-sardor-foreground">{t('home.nextStep')}</p>
      <h2 className="mt-1 text-lg leading-snug font-bold break-words">{topic.title}</h2>
      <div className="mt-3 flex items-end gap-3">
        <Sardor mood="confused" className="size-20" />
        <p className="mb-6 rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm leading-snug font-medium sticker">
          {t('home.sardorAsks')}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('home.checkpointReady')}</p>
      <Button asChild block className="mt-4">
        <Link to={paths.checkpoint(topic.topicId)}>
          {t('home.checkpointButton')}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  )
}
