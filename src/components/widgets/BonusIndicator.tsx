import React from 'react'
import Indicator from './Indicator'

interface BonusIndicatorProps {
  className?: string
}

const BonusIndicator = ({ className }: BonusIndicatorProps) => {
  return (
    <Indicator tooltipText="Bonus" className={className}>
      local_play
    </Indicator>
  )
}

export default BonusIndicator
