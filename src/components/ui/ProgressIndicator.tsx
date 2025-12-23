'use client'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { TranslationKey } from '@/types/translations'

interface ProgressIndicatorProps {
  progress: number // 0-100
  label?: TranslationKey
  animated?: boolean
  className?: string
}

export default function ProgressIndicator({ progress: rawProgress, label = 'LabelProgress', animated = true, className = '' }: ProgressIndicatorProps) {
  const t = useTypeSafeTranslations()
  const progress = Math.min(Math.max(rawProgress, 0), 100)

  return (
    <div className={`w-full pt-4 ${className}`}>
      {/* Progress percentage and label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">{typeof label === 'string' ? <p className="text-sm font-medium">{t(label)}</p> : label}</div>
        <p className="text-sm font-semibold min-w-[3rem] text-right">{progress.toFixed(0)}%</p>
      </div>

      {/* Progress bar container */}
      <div className="w-full bg-disabled rounded-full h-2 overflow-hidden">
        {/* Progress bar fill */}
        <div className={`h-full bg-accent rounded-full transition-all ${animated ? 'duration-300 ease-out' : ''}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
