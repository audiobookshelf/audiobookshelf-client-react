'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { createPortal } from 'react-dom'

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
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500'
      case 'error':
        return 'bg-red-600 border-red-500'
      case 'warning':
        return 'bg-yellow-600 border-yellow-500'
      case 'info':
      default:
        return 'bg-blue-600 border-blue-500'
    }
  }

  return (
    <div
      cy-id="toast"
      className={`transform transition-all duration-300 ease-in-out ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      onClick={handleClose}
    >
      <div className={`${getTypeClasses()} border rounded-lg shadow-lg p-4 max-w-sm w-full`}>
        <div className="flex items-start gap-3">
          <div cy-id="toast-icon" className="flex-shrink-0 w-5 h-5 text-white font-bold text-sm flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {title && <div className="font-semibold text-white text-sm mb-1">{title}</div>}
            <div className="text-white/90 text-sm">{message}</div>
          </div>
          <button
            cy-id="close-button"
            onClick={handleClose}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors duration-200"
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
