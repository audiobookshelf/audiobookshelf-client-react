'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import styles from './LoadingIndicator.module.css'

export default function LoadingIndicator() {
  const t = useTypeSafeTranslations()

  return (
    <div role="status" aria-live="polite" aria-label={t('LabelLoadingContent')}>
      <div className="w-40">
        <div className="bg-bg border border-gray-500 py-2 px-5 rounded-lg flex items-center flex-col box-shadow-md">
          <div cy-id="loading-indicator" className={`${styles['loader-dots']} block relative w-20 h-5 mt-2`} aria-hidden="true">
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div cy-id="loading-text" className="text-gray-200 text-xs font-light mt-2 text-center">
            {t('LabelLoadingIndicator')}
          </div>
        </div>
      </div>
    </div>
  )
}
