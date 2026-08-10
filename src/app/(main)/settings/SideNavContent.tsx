'use client'

import VersionFooter from '@/components/app/VersionFooter'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { isSettingsNavItemActive, SETTINGS_NAV_ITEMS } from './settingsNavItems'

interface SideNavContentProps {
  handleItemClick?: () => void
  serverVersion: string
  installSource: string
}

export default function SideNavContent({ handleItemClick, serverVersion, installSource }: SideNavContentProps) {
  const t = useTypeSafeTranslations()
  const pathname = usePathname()

  const items = useMemo(
    () =>
      SETTINGS_NAV_ITEMS.map((item) => ({
        label: t(item.messageKey),
        href: item.href
      })),
    [t]
  )

  return (
    <>
      <nav className="h-full max-h-[calc(100%-2rem)] w-full overflow-y-auto">
        {items.map((item) => {
          const isActive = isSettingsNavItemActive(pathname, item.href)

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleItemClick ?? undefined}
              className={mergeClasses(
                isActive && 'bg-nav-item-selected',
                'text-foreground border-primary/30 hover:bg-nav-item-hover relative flex h-12 w-full cursor-pointer items-center border-b px-3'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-primary/30 w-full border-t px-4 py-2">
        <VersionFooter serverVersion={serverVersion} installSource={installSource} variant="row" />
      </div>
    </>
  )
}
