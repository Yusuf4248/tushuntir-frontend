import { ComingSoon } from '@/components/coming-soon'
import { PageHeader } from '@/components/layout/page-header'
import { paths } from '@/routes/paths'

/** Until each school screen lands. */
export function SchoolPlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} backTo={paths.home} />
      <ComingSoon />
    </>
  )
}
