'use client'

import SideNavContent from './SideNavContent'

export default function SideNav({ serverVersion, installSource }: { serverVersion: string; installSource: string }) {
  return (
    <div className="w-44 min-w-44 h-full max-h-[calc(100vh-4rem)] bg-bg border-e border-border shadow-2xl z-10 hidden md:block">
      <SideNavContent serverVersion={serverVersion} installSource={installSource} />
    </div>
  )
}
