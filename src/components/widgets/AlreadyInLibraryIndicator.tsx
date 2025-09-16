import React from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import Indicator from './Indicator'

interface AlreadyInLibraryIndicatorProps {
  className?: string
}

const AlreadyInLibraryIndicator = ({ className }: AlreadyInLibraryIndicatorProps) => {
  return (
    <Indicator tooltipText="Already in your library" className={mergeClasses('text-success', className)}>
      check_circle
    </Indicator>
  )
}

export default AlreadyInLibraryIndicator
