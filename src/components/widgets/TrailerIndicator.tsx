import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Indicator from './Indicator'

interface TrailerIndicatorProps {
  className?: string
}

const TrailerIndicator = ({ className }: TrailerIndicatorProps) => {
  const t = useTypeSafeTranslations()
  return (
    <Indicator tooltipText={t('LabelTrailer')} className={className}>
      local_movies
    </Indicator>
  )
}

export default TrailerIndicator
