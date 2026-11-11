import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { t } from '@/lib/strings.uz'

export function CheckpointPlaceholderPage() {
  return (
    <>
      <PageHeader title={t.placeholder.checkpoint} backTo="/topics" backIcon="close" />
      <ComingSoon />
    </>
  )
}
