'use client'

import Btn from '@/components/ui/Btn'
import { useUser } from '@/contexts/UserContext'
import { useLogout } from '@/hooks/useLogout'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useRef, useState } from 'react'
import LogoutBtn from './LogoutBtn'

export default function AccountActionsRow() {
  const t = useTypeSafeTranslations()
  const { user } = useUser()
  const logout = useLogout()
  const isMobile = useMediaQuery('max-md')
  const size = isMobile ? 'small' : 'medium'
  const isGuest = user.type === 'guest'
  const [pending, setPending] = useState<'current' | 'all' | null>(null)
  const pendingRef = useRef(false)

  const handleLogout = async (allDevices: boolean) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(allDevices ? 'all' : 'current')
    try {
      await logout(allDevices)
    } catch (err) {
      console.error('Logout error:', err)
      pendingRef.current = false
      setPending(null)
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
      <Btn to="/account/change-password" size={size} className="shrink-0 whitespace-nowrap">
        {t('LabelChangePassword')}
      </Btn>
      {!isGuest && (
        <LogoutBtn
          allDevices
          size={size}
          className="ms-auto"
          loading={pending === 'all'}
          disabled={pending === 'current'}
          onClick={() => handleLogout(true)}
        />
      )}
      <LogoutBtn
        size={size}
        className={isGuest ? 'ms-auto' : undefined}
        loading={pending === 'current'}
        disabled={pending === 'all'}
        onClick={() => handleLogout(false)}
      />
    </div>
  )
}
