import { CalendarOff, FlagTriangleRight } from 'lucide-react'

import { errorMessage } from '@/api/errors'
import { useFinishLessonDemo, useToday } from '@/api/me'
import type { TodayLesson } from '@/api/types'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { env } from '@/lib/env'
import { t } from '@/lib/strings.uz'
import { cn } from '@/lib/utils'

import { LessonStatusChip } from './lesson-status-chip'
import { Section } from './section'

export function LessonsSection() {
  const today = useToday()

  return (
    <Section title={t.home.lessons}>
      {today.isPending ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4 border-b p-4 last:border-b-0">
              <Skeleton className="h-10 w-12" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : today.isError ? (
        <ErrorState
          message={errorMessage(today.error)}
          onRetry={() => void today.refetch()}
          retrying={today.isFetching}
        />
      ) : today.data.lessons.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={t.home.noLessons}
          description={t.home.noLessonsHint}
        />
      ) : (
        <ol className="overflow-hidden rounded-xl border bg-card shadow-card">
          {today.data.lessons.map((lesson) => (
            <LessonRow key={lesson.lessonId} lesson={lesson} />
          ))}
        </ol>
      )}
    </Section>
  )
}

function LessonRow({ lesson }: { lesson: TodayLesson }) {
  const finish = useFinishLessonDemo()
  const { toast } = useToast()

  function onFinish() {
    finish.mutate(lesson.lessonId, {
      onSuccess: (res) =>
        toast({
          variant: 'success',
          title: t.home.lessonFinished,
          description: res.quiz ? t.home.quizUnlocked : undefined,
        }),
      onError: (error) => toast({ variant: 'error', title: errorMessage(error) }),
    })
  }

  const finished = lesson.status === 'finished'

  return (
    <li
      className={cn(
        'flex gap-4 border-b p-4 last:border-b-0',
        lesson.status === 'in_progress' && 'bg-info-soft/40',
      )}
    >
      <div className="w-12 shrink-0 text-sm leading-tight tabular-nums">
        <p className="font-semibold">{lesson.startsAt ?? '—'}</p>
        <p className="text-muted-foreground">{lesson.endsAt ?? ''}</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <p className={cn('font-semibold', finished && 'text-muted-foreground')}>
            {lesson.subject.name}
          </p>
          <LessonStatusChip status={lesson.status} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {lesson.topic?.title ?? t.home.noTopic}
        </p>

        {env.demoMode && !finished && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-dashed"
            loading={finish.isPending}
            onClick={onFinish}
          >
            {!finish.isPending && <FlagTriangleRight aria-hidden />}
            {t.home.finishLessonDemo}
          </Button>
        )}
      </div>
    </li>
  )
}
