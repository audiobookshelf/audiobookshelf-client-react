'use client'

import Btn from '@/components/ui/Btn'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LogoutBtnProps {
  size?: 'small' | 'medium'
}

export default function LogoutBtn({ size = 'medium' }: LogoutBtnProps) {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Calls the Abs server logout endpoint and clears the NextJS server cookies
      const res = await fetch('/internal-api/logout', {
        method: 'POST'
      })
      if (!res.ok) {
        console.error('Logout error:', res.status, res.statusText)
        return
      }
      router.replace('/login')
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
