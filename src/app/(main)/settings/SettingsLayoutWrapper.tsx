'use client'

import { useUser } from '@/contexts/UserContext'
import SideNav from './SideNav'

interface SettingsLayoutWrapperProps {
  children: React.ReactNode
}

export default function SettingsLayoutWrapper({ children }: SettingsLayoutWrapperProps) {
  const { Source, serverSettings } = useUser()
  const installSource = Source || 'Unknown'
  const serverVersion = serverSettings?.version || 'Error'

  return (
    <div className="page-wrapper flex overflow-hidden">
      <SideNav serverVersion={serverVersion} installSource={installSource} />
      <div className="page-bg-gradient min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0 w-full overflow-x-hidden overflow-y-auto pb-8">{children}</div>
      </div>
    </div>
  )
}
