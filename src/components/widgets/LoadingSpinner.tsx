'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { memo } from 'react'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  size?: 'la-sm' | 'la-lg' | 'la-2x' | 'la-3x'
  className?: string
  color?: string
  invert?: boolean // invert the color of the spinner
}

const LoadingSpinner = memo(({ size = 'la-sm', className = '', color, invert = false }: LoadingSpinnerProps) => {
  const classList = mergeClasses(styles['la-ball-spin-clockwise'], styles[size], invert ? styles['la-invert'] : '', 'cursor-not-allowed', className)

  const style = color ? { color } : undefined

  return (
    <div cy-id="loading-spinner" className={classList} style={style}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
