'use client'

import { useState, useCallback } from 'react'
import { ToastMessage } from '@/components/widgets/ToastContainer'

let toastIdCounter = 0

export const useToast = () => {
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

  return {
    toasts,
    showToast,
    removeToast
  }
}

export default useToast
