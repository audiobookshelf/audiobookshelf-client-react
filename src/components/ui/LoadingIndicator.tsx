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
        <div className="bg-bg shadow-modal-content flex flex-col items-center rounded-lg border border-gray-500 px-5 py-2">
          <div cy-id="loading-indicator" className={`${styles['loader-dots']} relative mt-2 block h-5 w-20`} aria-hidden="true">
            <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-green-500"></div>
            <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div cy-id="loading-text" className="text-foreground-muted mt-2 text-center text-xs font-light">
            {displayLabel}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
