import { ChevronRight, Trophy } from 'lucide-react'
import { Link } from 'react-router'

import { errorMessage } from '@/api/errors'
import { useMastery } from '@/api/me'
import { ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

import { Section } from './section'

export function MasterySummary() {
  const mastery = useMastery()

  return (
    <Section
      title={t.home.mastery}
      action={
        <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary">
          <Link to={paths.topics}>
            {t.home.allTopics}
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      }
    >
      {mastery.isPending ? (
        <SkeletonCard lines={1} />
      ) : mastery.isError ? (
        <ErrorState
          message={errorMessage(mastery.error)}
          onRetry={() => void mastery.refetch()}
          retrying={mastery.isFetching}
        />
      ) : (
        <MasteryCard
          mastered={mastery.data.topics.filter((topic) => topic.status === 'mastered').length}
          total={mastery.data.topics.length}
        />
      )}
    </Section>
  )
}

function MasteryCard({ mastered, total }: { mastered: number; total: number }) {
  if (total === 0) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.home.noMasteryTopics}</p>
      </Card>
    )
  }
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success-soft text-success">
          <Trophy className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xl leading-none font-bold tabular-nums">
            {mastered}
            <span className="text-base font-medium text-muted-foreground"> / {total}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t.home.masteredOf(mastered, total)}</p>
        </div>
      </div>
      <ProgressBar
        className="mt-4"
        value={mastered}
        max={total}
        label={t.home.mastery}
        valueText={t.home.masteredOf(mastered, total)}
      />
    </Card>
  )
}
