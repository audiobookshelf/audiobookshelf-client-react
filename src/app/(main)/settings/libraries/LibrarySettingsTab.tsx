'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export default function LibrarySettingsTab() {
  const t = useTypeSafeTranslations()

  return (
    <div className="text-foreground-muted text-sm">
      <p>{t('HeaderSettings')}</p>
    </div>
  )
}
