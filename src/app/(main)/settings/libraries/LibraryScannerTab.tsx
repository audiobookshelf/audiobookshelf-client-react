'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export default function LibraryScannerTab() {
  const t = useTypeSafeTranslations()

  return (
    <div className="text-foreground-muted text-sm">
      <p>{t('HeaderSettingsScanner')}</p>
    </div>
  )
}
