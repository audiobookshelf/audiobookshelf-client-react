'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'

export interface ToastMessage {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove?: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 end-4 z-60 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} id={toast.id} type={toast.type} title={toast.title} message={toast.message} duration={toast.duration} onClose={onRemove} />
      ))}
    </div>,
    document.body
  )
}

export default ToastContainer
