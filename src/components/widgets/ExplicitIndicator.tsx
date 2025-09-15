import React from 'react'
import Indicator from './Indicator'

interface ExplicitIndicatorProps {
  className?: string
}

const ExplicitIndicator = ({ className }: ExplicitIndicatorProps) => {
  return (
    <Indicator tooltipText="Explicit" className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="
            M40 40 L472 40 L472 472 L40 472 L40 40 Z

            M176 120 L336 120 L336 162 L226 162
            L226 230 L316 230 L316 276 L226 276
            L226 338 L336 338 L336 380 L176 380 Z
          "
        />
      </svg>
    </Indicator>
  )
}

export default ExplicitIndicator
