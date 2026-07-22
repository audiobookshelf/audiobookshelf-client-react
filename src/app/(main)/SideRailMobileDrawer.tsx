'use client'

import IconBtn from '@/components/ui/IconBtn'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { useMediaNavigation } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import SideRailContent from './SideRailContent'

interface SideRailMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  libraries?: Library[]
  currentLibraryId?: string
}

export default function SideRailMobileDrawer({ isOpen, onClose, libraries, currentLibraryId }: SideRailMobileDrawerProps) {
  const t = useTypeSafeTranslations()
  const pathname = usePathname()
  const { lastCurrentLibraryId } = useMediaNavigation()
  const { userDefaultLibraryId, serverSettings, Source } = useUser()

  const serverVersion = serverSettings?.version || 'Error'
  const installSource = Source || 'Unknown'

  const effectiveLibraryId = currentLibraryId || lastCurrentLibraryId || userDefaultLibraryId
  const library = libraries?.find((lib) => lib.id === effectiveLibraryId)
  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return
    }
    previousPathnameRef.current = pathname
    onClose()
  }, [pathname, onClose])

  if (!library) {
    return null
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleItemClick = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-100 ease-in-out ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`bg-bg box-shadow-side border-border fixed top-0 left-0 z-70 flex h-full w-64 min-w-64 transform flex-col border-e shadow-2xl transition-transform duration-100 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-primary/30 shrink-0 border-b px-4 py-3">
          <p className="text-foreground-subdued text-xs font-semibold tracking-wide uppercase">{t('LabelLibrary')}</p>
          <div className="mt-1 flex items-center gap-2">
            <LibraryIcon icon={library.icon} size={6} decorative className="text-foreground-muted" />
            <h2 className="text-foreground-muted min-w-0 flex-1 truncate text-base font-medium">{library.name}</h2>
            <IconBtn className="shrink-0" ariaLabel="Menu" size="large" borderless onClick={onClose}>
              arrow_back
            </IconBtn>
          </div>
        </div>
        <div className="min-h-0 w-full flex-1">
          <SideRailContent
            libraryId={library.id}
            mediaType={library.mediaType}
            serverVersion={serverVersion}
            installSource={installSource}
            onItemClick={handleItemClick}
            variant="drawer"
          />
        </div>
      </div>
    </>
  )
}
