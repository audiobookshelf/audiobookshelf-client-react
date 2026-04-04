'use client'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { TranslationKey } from '@/types/translations'

interface ProgressIndicatorProps {
  progress: number // 0-100
  label?: TranslationKey
  className?: string
}

export default function ProgressIndicator({ progress: rawProgress, label = 'LabelProgress', className = '' }: ProgressIndicatorProps) {
  const t = useTypeSafeTranslations()
  const progress = Math.min(Math.max(rawProgress, 0), 100)

  return (
    <div className={mergeClasses('w-full pt-4', className)}>
      {/* Progress percentage and label */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex-1">{typeof label === 'string' ? <p className="text-sm font-medium">{t(label)}</p> : label}</div>
        <p className="min-w-[3rem] text-right text-sm font-semibold">{progress.toFixed(0)}%</p>
      </div>

      {/* Progress bar container */}
      <div className="bg-disabled h-2 w-full overflow-hidden rounded-full">
        {/* Progress bar fill */}
        <div className="bg-accent h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
