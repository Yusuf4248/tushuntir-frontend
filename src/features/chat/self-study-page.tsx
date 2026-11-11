import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { t } from '@/lib/strings.uz'

export function SelfStudyPage() {
  return (
    <>
      <PageHeader title={t.selfStudy.title} />
      <ComingSoon description={t.selfStudy.description} />
    </>
  )
}
