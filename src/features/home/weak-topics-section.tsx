import { Dumbbell, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useWeakTopics } from '@/api/me'
import { StatusChip } from '@/components/status-chip'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { Section } from './section'

const MAX_WEAK_TOPICS = 3

export function WeakTopicsSection() {
  const weak = useWeakTopics()

  return (
    <Section title={t.home.weakTopics}>
      {weak.isPending ? (
        <SkeletonCard lines={2} />
      ) : weak.isError ? (
        <ErrorState
          message={errorMessage(weak.error)}
          onRetry={() => void weak.refetch()}
          retrying={weak.isFetching}
        />
      ) : weak.data.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t.home.noWeakTopics}
          description={t.home.noWeakTopicsHint}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {weak.data.slice(0, MAX_WEAK_TOPICS).map((topic) => (
            <li key={topic.topicId}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{topic.title}</p>
                    <p className="text-sm text-muted-foreground">{topic.subject}</p>
                  </div>
                  <StatusChip status={topic.status} />
                </div>
                {(topic.subSkills.length > 0 || topic.openMistakes > 0) && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[
                      topic.subSkills.slice(0, 2).join(', '),
                      topic.openMistakes > 0 && t.home.openMistakes(topic.openMistakes),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link to={paths.practice(topic.topicId)}>
                    <Dumbbell aria-hidden />
                    {t.home.practice}
                  </Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
