'use client'

import VersionFooter from '@/components/app/VersionFooter'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface SideNavContentProps {
  handleItemClick?: () => void
  serverVersion: string
  installSource: string
}

export default function SideNavContent({ handleItemClick, serverVersion, installSource }: SideNavContentProps) {
  const t = useTypeSafeTranslations()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isUserScopedListeningSessions = pathname === '/settings/listening-sessions' && searchParams.has('user')

  const items = useMemo(
    () => [
      {
        label: t('HeaderSettings'),
        href: '/settings'
      },
      {
        label: t('HeaderLibraries'),
        href: '/settings/libraries'
      },
      {
        label: t('HeaderUsers'),
        href: '/settings/users'
      },
      {
        label: t('HeaderApiKeys'),
        href: '/settings/api-keys'
      },
      {
        label: t('HeaderListeningSessions'),
        href: '/settings/listening-sessions'
      },
      {
        label: t('HeaderBackups'),
        href: '/settings/backups'
      },
      {
        label: t('HeaderLogs'),
        href: '/settings/logs'
      },
      {
        label: t('HeaderNotifications'),
        href: '/settings/notifications'
      },
      {
        label: t('HeaderEmail'),
        href: '/settings/email'
      },
      {
        label: t('HeaderItemMetadataUtils'),
        href: '/settings/item-metadata-utils'
      },
      {
        label: t('HeaderRSSFeeds'),
        href: '/settings/rss-feeds'
      },
      {
        label: t('HeaderAuthentication'),
        href: '/settings/authentication'
      }
    ],
    [t]
  )

  return (
    <>
      <nav className="h-full max-h-[calc(100%-2rem)] w-full overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href && !(item.href === '/settings/listening-sessions' && isUserScopedListeningSessions)

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
