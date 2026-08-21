'use client'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SettingsNavPage from './SettingsNavPage'

export default function SettingsIndexClient() {
  const isMobile = useMediaQuery('max-md')
  const router = useRouter()

  useEffect(() => {
    if (!isMobile) {
      router.replace('/settings/general')
    }
  }, [isMobile, router])

  if (!isMobile) return null

  return <SettingsNavPage />
}
