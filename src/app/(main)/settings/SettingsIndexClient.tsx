'use client'

import { getMediaQuery, useMediaQuery } from '@/hooks/useMediaQuery'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SettingsNavPage from './SettingsNavPage'

export default function SettingsIndexClient() {
  const isMobile = useMediaQuery('max-md')
  const router = useRouter()

  useEffect(() => {
    // isMobile is the server snapshot (false) during hydration, so check the live query before redirecting
    if (!isMobile && !window.matchMedia(getMediaQuery('max-md')).matches) {
      router.replace('/settings/general')
    }
  }, [isMobile, router])

  if (!isMobile) return null

  return <SettingsNavPage />
}
