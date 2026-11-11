import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { t } from '@/lib/strings.uz'

export function HomePage() {
  return (
    <>
      <PageHeader title={t.nav.home} />
      <ComingSoon />
    </>
  )
}
