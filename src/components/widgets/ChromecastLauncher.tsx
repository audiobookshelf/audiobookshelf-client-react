'use client'

import Tooltip from '@/components/ui/Tooltip'
import { setChromecastLibraryId, useChromecast } from '@/contexts/ChromecastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { memo, useEffect, useRef } from 'react'

interface ChromecastLauncherProps {
  libraryId?: string
}

function ChromecastLauncher({ libraryId }: ChromecastLauncherProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()
  const { isChromecastInitialized, isHttps } = useChromecast()
  const launcherContainerRef = useRef<HTMLDivElement>(null)
  const chromecastEnabled = serverSettings.chromecastEnabled

  useEffect(() => {
    setChromecastLibraryId(libraryId ?? null)
  }, [libraryId])

  // Mount google-cast-launcher once; recreating it on parent re-renders causes the Cast dialog to flicker.
  useEffect(() => {
    const container = launcherContainerRef.current
    if (!container || !chromecastEnabled || !isChromecastInitialized || !isHttps) return

    const launcher = document.createElement('google-cast-launcher')
    launcher.classList.add('h-6')
    container.appendChild(launcher)

    return () => {
      launcher.remove()
    }
  }, [chromecastEnabled, isChromecastInitialized, isHttps])

  if (!chromecastEnabled || !isChromecastInitialized) return null

  if (!isHttps) {
    return (
      <Tooltip text={t('MessageCastingRequiresHttps')} position="bottom">
        <span className="material-symbols text-warning/50 text-2.5xl" aria-hidden>
          cast
        </span>
      </Tooltip>
    )
  }

  return <div ref={launcherContainerRef} className="ms-1 me-1 flex h-6 w-6 min-w-6 cursor-pointer items-center sm:mx-2" />
}

export default memo(ChromecastLauncher)
