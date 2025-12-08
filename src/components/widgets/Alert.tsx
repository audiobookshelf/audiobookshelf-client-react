'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useEffect, useRef } from 'react'

export interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info'
  autoFocus?: boolean
  children: React.ReactNode
  className?: string
}

export default function Alert({ type = 'error', autoFocus = true, children, className }: AlertProps) {
  const t = useTypeSafeTranslations()
  const alertRef = useRef<HTMLDivElement>(null)

  const isAlert = type === 'error' || type === 'warning'
  const icon = isAlert ? 'report' : 'info'
  const alertRole = isAlert ? 'alert' : 'status'

  const prefix =
    type === 'error'
      ? t('LabelError')
      : type === 'warning'
        ? t('LabelWarning')
        : type === 'success'
          ? t('LabelSuccess')
          : type === 'info'
            ? t('LabelInformation')
            : t('LabelAlert')

  const typeClasses =
    type === 'error'
      ? 'bg-error/5 border-error/60 text-error'
      : type === 'warning'
        ? 'bg-warning/5 border-warning/60 text-warning'
        : type === 'success'
          ? 'bg-success/5 border-success/60 text-success'
          : type === 'info'
            ? 'bg-info/5 border-info/60 text-info'
            : 'bg-primary/5 border-primary/60 text-primary'

  const wrapperClass = mergeClasses('w-full border rounded-lg flex items-center relative py-4 ps-16', typeClasses, className)

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
