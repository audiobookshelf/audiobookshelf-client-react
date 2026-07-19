'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

function ShadowSkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={mergeClasses('box-shadow-book animate-pulse rounded-sm bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700', className)}
      aria-hidden="true"
    />
  )
}

export default function UserListeningStatsSkeleton() {
  const t = useTypeSafeTranslations()

  return (
    <div className="py-2" aria-busy="true" aria-live="polite">
      <h2 className="mb-2 text-lg font-medium">{t('HeaderListeningStats')}</h2>

      <div className="flex items-center gap-2">
        <ShadowSkeletonBar className="h-4 w-36" />
        <ShadowSkeletonBar className="h-7 w-16 rounded-md" />
      </div>

      <ShadowSkeletonBar className="mt-2 h-4 w-52" />

      <div className="mt-4">
        <h2 className="mb-2 text-lg font-medium">{t('HeaderLastListeningSession')}</h2>
        <ShadowSkeletonBar className="h-6 w-full max-w-md" />
      </div>
    </div>
  )
}
