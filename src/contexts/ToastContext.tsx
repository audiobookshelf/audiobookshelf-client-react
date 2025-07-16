'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastMessage } from '@/components/widgets/ToastContainer'

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (
    message: string,
    options?: {
      type?: 'success' | 'error' | 'warning' | 'info'
      title?: string
      duration?: number
    }
  ) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastIdCounter = 0

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (
      message: string,
      options?: {
        type?: 'success' | 'error' | 'warning' | 'info'
        title?: string
        duration?: number
      }
    ) => {
      const id = `toast-${++toastIdCounter}`
      const newToast: ToastMessage = {
        id,
        message,
        type: options?.type || 'info',
        title: options?.title,
        duration: options?.duration ?? 5000
      }

      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value: ToastContextType = {
    toasts,
    showToast,
    removeToast
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export const useGlobalToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useGlobalToast must be used within a ToastProvider')
  }
  return context
}
