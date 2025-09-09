'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { mergeClasses } from '@/lib/merge-classes'

export default function SideNav() {
  const pathname = usePathname()

  const items = [
    {
      label: 'Settings',
      href: '/settings'
    },
    {
      label: 'Libraries',
      href: '/settings/libraries'
    },
    {
      label: 'Users',
      href: '/settings/users'
    },
    {
      label: 'API Keys',
      href: '/settings/api-keys'
    },
    {
      label: 'Listening Sessions',
      href: '/settings/listening-sessions'
    },
    {
      label: 'Backups',
      href: '/settings/backups'
    },
    {
      label: 'Logs',
      href: '/settings/logs'
    },
    {
      label: 'Notifications',
      href: '/settings/notifications'
    },
    {
      label: 'Email',
      href: '/settings/email'
    },
    {
      label: 'Item Metadata Utils',
      href: '/settings/item-metadata-utils'
    },
    {
      label: 'RSS Feeds',
      href: '/settings/rss-feeds'
    },
    {
      label: 'Authentication',
      href: '/settings/authentication'
    }
  ]

  return (
    <div className="w-44 min-w-44 h-full max-h-[calc(100vh-4rem)] bg-bg border-e border-border shadow-2xl z-10">
      <div className="w-full h-full max-h-[calc(100%-3rem)] overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={mergeClasses(
              pathname === item.href && 'bg-primary/70',
              'w-full h-12 text-white border-b border-primary/30 hover:bg-primary/30 cursor-pointer relative flex items-center px-3'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
