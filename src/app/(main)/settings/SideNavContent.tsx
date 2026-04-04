import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SideNavContentProps {
  handleItemClick?: () => void
  serverVersion: string
  installSource: string
}

export default function SideNavContent({ handleItemClick, serverVersion, installSource }: SideNavContentProps) {
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
    <>
      <nav className="h-full max-h-[calc(100%-2rem)] w-full overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={handleItemClick ?? undefined}
            className={mergeClasses(
              pathname === item.href && 'bg-nav-item-selected',
              'text-foreground border-primary/30 hover:bg-nav-item-hover relative flex h-12 w-full cursor-pointer items-center border-b px-3'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-primary/30 flex h-8 w-full items-center justify-between border-t px-4 py-2">
        <p className="text-foreground-muted text-center font-mono text-xs">v{serverVersion}</p>
        <p className="text-xxs text-foreground-subdued text-center italic">{installSource}</p>
      </div>
    </>
  )
}
