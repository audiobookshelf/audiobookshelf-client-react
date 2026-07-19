'use client'

import { mergeClasses } from '@/lib/merge-classes'
import type { CSSProperties, HTMLAttributes } from 'react'

interface SkeletonBarProps extends HTMLAttributes<HTMLElement> {
  animationDelay?: string
  inline?: boolean
}

export default function SkeletonBar({ className, animationDelay, inline = false, style, ...props }: SkeletonBarProps) {
  const Component = inline ? 'span' : 'div'
  const animationStyle: CSSProperties | undefined = animationDelay ? { animationDelay, animationDuration: '1.5s', ...style } : style

  return (
    <Component
      className={mergeClasses('animate-pulse rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700', className)}
      style={animationStyle}
      aria-hidden="true"
      {...props}
    />
  )
}
