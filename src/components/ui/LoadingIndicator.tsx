'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import styles from './LoadingIndicator.module.css'

interface LoadingIndicatorProps {
  label?: string
  children?: React.ReactNode
  /**
   * `overlay` — full-bleed dimmed layer (`absolute inset-0 bg-black/50`), for covering a `relative` parent.
   * `inline` — centered loader card only; use inside modals or regions that already define size/background.
   */
  variant?: 'overlay' | 'inline'
}

export default function LoadingIndicator({ label, children, variant = 'overlay' }: LoadingIndicatorProps) {
  const t = useTypeSafeTranslations()
  const displayLabel = label ?? t('LabelLoadingIndicator')

  const rootClass = variant === 'inline' ? 'flex items-center justify-center' : 'absolute inset-0 z-50 flex items-center justify-center bg-black/50'

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-label={displayLabel}>
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
