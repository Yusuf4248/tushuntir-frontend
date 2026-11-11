import { Construction } from 'lucide-react'

import { EmptyState } from '@/components/states'
import { t } from '@/lib/strings.uz'

export function ComingSoon({ description = t.placeholder.description }: { description?: string }) {
  return <EmptyState icon={Construction} title={t.placeholder.title} description={description} />
}
