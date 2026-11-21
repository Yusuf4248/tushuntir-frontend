import { useEffect } from 'react'

import { t } from '@/lib/i18n'

/** "Darsliklar · Tushuntir" in the browser tab (and in screen-reader page announcements). */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${t('app.name')}` : t('app.name')
  }, [title])
}
