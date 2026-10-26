'use client'

import Btn from '@/components/ui/Btn'
import { useLogout } from '@/hooks/useLogout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useState } from 'react'

interface LogoutBtnProps {
  size?: 'small' | 'medium'
  allDevices?: boolean
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void | Promise<void>
}

export default function LogoutBtn({ size = 'medium', allDevices = false, loading: loadingProp, disabled = false, className, onClick }: LogoutBtnProps) {
  const t = useTypeSafeTranslations()
  const logout = useLogout()
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = loadingProp ?? internalLoading

  const handleLogout = async () => {
    if (onClick) {
      await onClick()
      return
    }

    setInternalLoading(true)
    try {
      await logout(allDevices)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <Btn
      onClick={() => void handleLogout()}
      loading={loading}
      disabled={disabled}
      size={size}
      className={mergeClasses('shrink-0 items-center justify-between gap-2 whitespace-nowrap', size === 'small' ? 'ps-4' : 'ps-6', className)}
    >
      <span className="material-symbols text-lg">{allDevices ? 'devices' : 'logout'}</span>
      {allDevices ? t('ButtonLogoutAllDevices') : t('LabelLogout')}
    </Btn>
  )
}
