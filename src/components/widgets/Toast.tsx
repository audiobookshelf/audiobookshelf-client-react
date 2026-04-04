'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useEffect, useState } from 'react'

export interface ToastProps {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  onClose?: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ id, type = 'info', title, message, duration = 5000, onClose }) => {
  const t = useTypeSafeTranslations()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose?.(id)
    }, 300) // Match the transition duration
  }, [id, onClose])

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, handleClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'info'
    }
  }

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-success border-success'
      case 'error':
        return 'bg-error border-error'
      case 'warning':
        return 'bg-warning border-warning'
      case 'info':
      default:
        return 'bg-info border-info'
    }
  }

  return (
    <div
      cy-id="toast"
      className={`transform transition-all duration-300 ease-in-out ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      onClick={handleClose}
    >
      <div className={`${getTypeClasses()} w-full max-w-sm rounded-lg border p-4 shadow-lg`}>
        <div className="flex items-start gap-3">
          <span cy-id="toast-icon" className="material-symbols flex-shrink-0 text-xl text-white" aria-hidden="true">
            {getIcon()}
          </span>
          <div className="min-w-0 flex-1">
            {title && <div className="mb-1 text-sm font-semibold text-white">{title}</div>}
            <div className="text-sm text-white/90">{message}</div>
          </div>
          <button
            cy-id="close-button"
            onClick={handleClose}
            className="flex-shrink-0 text-white/70 transition-colors duration-200 hover:text-white"
            aria-label={t('ButtonCloseNotification')}
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
