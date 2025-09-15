import React from 'react'
import Indicator from './Indicator'

interface TrailerIndicatorProps {
  className?: string
}

const TrailerIndicator = ({ className }: TrailerIndicatorProps) => {
  return (
    <Indicator tooltipText="Trailer" className={className}>
      local_movies
    </Indicator>
  )
}

export default TrailerIndicator
