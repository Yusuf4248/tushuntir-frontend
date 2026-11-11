import { useParams } from 'react-router'

import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { t } from '@/lib/strings.uz'
import { paths } from '@/routes/paths'

/** /chat/:topicId — the study helper arrives in F3. */
export function ChatPlaceholderPage() {
  const topicId = Number(useParams().topicId)
  return (
    <>
      <PageHeader title={t.selfStudy.title} backTo={paths.topic(topicId)} backIcon="close" />
      <ComingSoon description={t.selfStudy.description} />
    </>
  )
}
