'use client'

import { useGlobalToast } from '@/contexts/ToastContext'
import ToastContainer from './ToastContainer'

export default function GlobalToastContainer() {
  const { toasts, removeToast } = useGlobalToast()

  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}
