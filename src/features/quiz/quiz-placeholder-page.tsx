import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { t } from '@/lib/strings.uz'

/** /quiz/:quizId (lesson quiz), /topics/:topicId/quiz and /practice/:topicId. */
export function QuizPlaceholderPage({ kind }: { kind: 'quiz' | 'practice' }) {
  return (
    <>
      <PageHeader
        title={kind === 'quiz' ? t.placeholder.quiz : t.placeholder.practice}
        backTo="/"
        backIcon="close"
      />
      <ComingSoon />
    </>
  )
}
