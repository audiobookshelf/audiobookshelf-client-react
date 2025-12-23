'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { TranslationKey } from '@/types/translations'
import styles from './LoadingIndicator.module.css'

interface LoadingIndicatorProps {
  label?: TranslationKey
  children?: React.ReactNode
}

export default function LoadingIndicator({ label, children }: LoadingIndicatorProps) {
  const t = useTypeSafeTranslations()
  if (!label) {
    label = 'LabelLoadingContent'
  }
  const displayLabel = t(label)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" role="status" aria-live="polite" aria-label={label}>
      <div className="w-40">
        <div className="bg-bg border border-gray-500 py-2 px-5 rounded-lg flex items-center flex-col shadow-modal-content">
          <div cy-id="loading-indicator" className={`${styles['loader-dots']} block relative w-20 h-5 mt-2`} aria-hidden="true">
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div cy-id="loading-text" className="text-foreground-muted text-xs font-light mt-2 text-center">
            {displayLabel}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
