'use client'

import SideNavContent from './SideNavContent'

export default function SideNav({ serverVersion, installSource }: { serverVersion: string; installSource: string }) {
  return (
    <div className="bg-bg border-border z-10 hidden h-full max-h-[calc(100vh-4rem)] w-44 min-w-44 border-e shadow-2xl md:block">
      <SideNavContent serverVersion={serverVersion} installSource={installSource} />
    </div>
  )
}
