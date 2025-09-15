import React from 'react'
import Indicator from './Indicator'

interface AbridgedIndicatorProps {
  className?: string
}

const AbridgedIndicator = ({ className }: AbridgedIndicatorProps) => {
  return (
    <Indicator tooltipText="Abridged" className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="
            M40 40 L472 40 L472 472 L40 472 L40 40 Z
            
            M246 120 L266 120 L376 380 L314 380 L292 326 L220 326 L198 380 L136 380 L246 120 Z
            M256 210 L230 278 L282 278 L256 210 Z
          "
        />
      </svg>
    </Indicator>
  )
}

export default AbridgedIndicator
