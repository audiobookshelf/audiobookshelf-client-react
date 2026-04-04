'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { mergeClasses } from '@/lib/merge-classes'
import SideNav from './SideNav'
import SideNavMobileDrawer from './SideNavMobileDrawer'

interface SettingsLayoutWrapperProps {
  children: React.ReactNode
}

export default function SettingsLayoutWrapper({ children }: SettingsLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()
  const { Source, serverSettings } = useUser()
  const installSource = Source || 'Unknown'
  const serverVersion = serverSettings?.version || 'Error'

  return (
    <div className={mergeClasses('page-wrapper flex overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideNav serverVersion={serverVersion} installSource={installSource} />
      <div className="page-bg-gradient min-w-0 flex-1">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>

      <SideNavMobileDrawer serverVersion={serverVersion} installSource={installSource} />
    </div>
  )
}
