'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useSettingsDrawer } from '@/contexts/SettingsDrawerContext'
import SideNavContent from './SideNavContent'

interface SideNavMobileDrawerProps {
  serverVersion: string
  installSource: string
}

export default function SideNavMobileDrawer({ serverVersion, installSource }: SideNavMobileDrawerProps) {
  const { isOpen, toggle, close } = useSettingsDrawer()

  const handleBackdropClick = () => {
    close()
  }

  const handleItemClick = () => {
    close()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-100 ease-in-out md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        className={`bg-bg border-border fixed top-0 left-0 z-70 h-full w-64 transform border-e shadow-2xl transition-transform duration-100 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-primary/30 flex h-12 w-full items-center justify-end border-b px-4 py-2">
          <IconBtn className="md:hidden" ariaLabel="Menu" size="large" borderless onClick={toggle}>
            arrow_back
          </IconBtn>
        </div>
        <div className="h-full max-h-[calc(100%-3rem)] w-full">
          <SideNavContent handleItemClick={handleItemClick} serverVersion={serverVersion} installSource={installSource} />
        </div>
      </div>
    </>
  )
}
