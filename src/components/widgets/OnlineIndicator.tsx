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
        <div className="text-success h-2.5 w-2.5 animate-pulse">
          <svg className="block h-full w-full" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill="currentColor" />
          </svg>
        </div>
      ) : (
        <svg className="text-foreground/20 block h-2.5 w-2.5" viewBox="0 0 10 10" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="currentColor" />
        </svg>
      )}
    </Indicator>
  )
}

export default OnlineIndicator
