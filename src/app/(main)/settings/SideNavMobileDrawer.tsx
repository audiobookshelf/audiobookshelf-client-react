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
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-100 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-bg border-e border-border shadow-2xl z-70 md:hidden transform transition-transform duration-100 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="w-full h-12 px-4 py-2 border-b border-primary/30 flex items-center justify-end">
          <IconBtn className="md:hidden" ariaLabel="Menu" size="large" borderless onClick={toggle}>
            arrow_back
          </IconBtn>
        </div>
        <div className="w-full h-full max-h-[calc(100%-3rem)]">
          <SideNavContent handleItemClick={handleItemClick} serverVersion={serverVersion} installSource={installSource} />
        </div>
      </div>
    </>
  )
}
