'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

export interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info'
  autoFocus?: boolean
  children: React.ReactNode
  className?: string
}

export default function Alert({ type = 'error', autoFocus = true, children, className }: AlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)

  const isAlert = useMemo(() => {
    return type === 'error' || type === 'warning'
  }, [type])

  const icon = useMemo(() => {
    return isAlert ? 'report' : 'info'
  }, [isAlert])

  const prefix = useMemo(() => {
    switch (type) {
      case 'error':
        return 'Error'
      case 'warning':
        return 'Warning'
      case 'success':
        return 'Success'
      case 'info':
        return 'Information'
      default:
        return 'Alert'
    }
  }, [type])

  const alertRole = useMemo(() => {
    return isAlert ? 'alert' : 'status'
  }, [type])

  const wrapperClass = useMemo(() => {
    const baseClasses = 'w-full border rounded-lg flex items-center relative py-4 ps-16'

    const typeClasses = (() => {
      switch (type) {
        case 'error':
          return 'bg-error/5 border-error/60 text-error'
        case 'warning':
          return 'bg-warning/5 border-warning/60 text-warning'
        case 'success':
          return 'bg-success/5 border-success/60 text-success'
        case 'info':
          return 'bg-info/5 border-info/60 text-info'
        default:
          return 'bg-primary/5 border-primary/60 text-primary'
      }
    })()

    return mergeClasses(baseClasses, typeClasses, className)
  }, [type, className])

  useEffect(() => {
    if (isAlert && alertRef.current && autoFocus) {
      alertRef.current.focus()
    }
  }, [isAlert, autoFocus])

  return (
    <div cy-id="alert" className={wrapperClass} role={alertRole} tabIndex={isAlert ? -1 : undefined} ref={alertRef}>
      <div className="absolute top-0 start-4 h-full flex items-center">
        <span cy-id="alert-icon" className="material-symbols text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div>
        <span className="sr-only">{prefix}: </span>
        {children}
      </div>
    </div>
  )
}
