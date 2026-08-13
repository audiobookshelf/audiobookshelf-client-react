'use client'

import VersionFooter from '@/components/app/VersionFooter'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Link from 'next/link'
import { useMemo } from 'react'
import { SETTINGS_NAV_ITEMS } from './settingsNavItems'

export default function SettingsNavPage() {
  const t = useTypeSafeTranslations()
  const { Source, serverSettings } = useUser()
  const installSource = Source || 'Unknown'
  const serverVersion = serverSettings?.version || 'Error'

  const items = useMemo(
    () =>
      SETTINGS_NAV_ITEMS.map((item) => ({
        href: item.href,
        label: t(item.messageKey)
      })),
    [t]
  )

  return (
    <div className="mx-auto w-full max-w-4xl p-2 md:hidden md:p-6">
      <div className="bg-bg border-border rounded-md border p-2 shadow-lg sm:p-4">
        <nav className="flex flex-col gap-2 py-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="bg-primary/40 hover:bg-primary/60 text-foreground-muted hover:text-foreground rounded-md p-4">
              <div className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="material-symbols text-xl">arrow_forward</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="border-primary/30 w-full border-t px-4 py-2">
          <VersionFooter serverVersion={serverVersion} installSource={installSource} variant="row" />
        </div>
      </div>
    </div>
  )
}
