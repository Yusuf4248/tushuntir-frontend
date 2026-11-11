import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'

import { Logo } from '@/components/logo'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/strings.uz'
import { useDocumentTitle } from '@/lib/use-document-title'

import { paths } from './paths'

export function NotFoundPage() {
  useDocumentTitle(t.notFound.title)
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo className="size-12" />
      <EmptyState
        className="w-full"
        icon={MapPinOff}
        title={t.notFound.title}
        description={t.notFound.description}
        action={
          <Button asChild>
            <Link to={paths.home}>{t.notFound.home}</Link>
          </Button>
        }
      />
    </main>
  )
}
