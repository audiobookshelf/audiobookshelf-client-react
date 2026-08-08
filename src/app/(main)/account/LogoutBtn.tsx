'use client'

import Btn from '@/components/ui/Btn'
import { useLogout } from '@/hooks/useLogout'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface LogoutBtnProps {
  size?: 'small' | 'medium'
}

export default function LogoutBtn({ size = 'medium' }: LogoutBtnProps) {
  const t = useTranslations()
  const logout = useLogout()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Btn
      onClick={handleLogout}
      loading={loading}
      size={size}
      className={`ms-auto shrink-0 items-center justify-between gap-2 whitespace-nowrap ${size === 'small' ? 'ps-4' : 'ps-6'}`}
    >
      <span className="material-symbols text-lg">logout</span>
      {t('LabelLogout')}
    </Btn>
  )
}
