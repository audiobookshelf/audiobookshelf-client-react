import React from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Indicator from './Indicator'

interface BonusIndicatorProps {
  className?: string
}

const BonusIndicator = ({ className }: BonusIndicatorProps) => {
  const t = useTypeSafeTranslations()
  return (
    <Indicator tooltipText={t('LabelBonus')} className={className}>
      local_play
    </Indicator>
  )
}

export default BonusIndicator
