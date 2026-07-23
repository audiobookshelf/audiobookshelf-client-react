'use client'

import SkeletonBar from '@/components/ui/SkeletonBar'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export default function UserListeningStatsSkeleton() {
  const t = useTypeSafeTranslations()

  return (
    <div className="py-2" aria-busy="true" aria-live="polite">
      {/* Listening stats section */}
      <h2 className="mb-2 text-lg font-medium">{t('HeaderListeningStats')}</h2>

      {/* Session count and view-all button */}
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-4 w-36 rounded-sm" />
        <SkeletonBar className="h-7 w-16 rounded-md" />
      </div>

      {/* Total time listened */}
      <div className="mt-2">
        <SkeletonBar className="h-4 w-52 rounded-sm" />
      </div>

      {/* Last listening session */}
      <div className="mt-4">
        <h2 className="mb-2 text-lg font-medium">{t('HeaderLastListeningSession')}</h2>
        <SkeletonBar className="h-6 w-full max-w-md rounded-sm" />
      </div>
    </div>
  )
}
