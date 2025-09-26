import React from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Indicator from './Indicator'

interface OnlineIndicatorProps {
  value: boolean
  className?: string
}

const OnlineIndicator = ({ value, className }: OnlineIndicatorProps) => {
  const t = useTypeSafeTranslations()
  const statusText = value ? t('LabelOnline') : t('LabelOffline')

  return (
    <Indicator role="status" tooltipText={statusText} className={className}>
      {value ? (
        <div className="w-3 h-3 text-success animate-pulse">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
          </svg>
        </div>
      ) : (
        <svg className="w-3 h-3 text-white/20" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        </svg>
      )}
    </Indicator>
  )
}

export default OnlineIndicator
