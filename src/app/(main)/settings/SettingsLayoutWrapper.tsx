'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'
import { UserLoginResponse } from '@/types/api'
import SideNav from './SideNav'
import SideNavMobileDrawer from './SideNavMobileDrawer'

interface SettingsLayoutWrapperProps {
  children: React.ReactNode
  currentUser: UserLoginResponse
}

export default function SettingsLayoutWrapper({ children, currentUser }: SettingsLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()
  const installSource = currentUser?.Source || 'Unknown'
  const serverVersion = currentUser?.serverSettings?.version || 'Error'

  return (
    <div className={mergeClasses('flex page-wrapper overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideNav serverVersion={serverVersion} installSource={installSource} />
      <div className="flex-1 min-w-0 page-bg-gradient">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>

      <SideNavMobileDrawer serverVersion={serverVersion} installSource={installSource} />
    </div>
  )
}
