'use client'

import Link from 'next/link'

interface AppBarNavMenuItemProps {
  id: string
  className: string
  ariaLabel: string
  tabIndex?: number
  icon: string
  label: string
  href?: string
  onClick: () => void
}

export default function AppBarNavMenuItem({ id, className, ariaLabel, tabIndex, icon, label, href, onClick }: AppBarNavMenuItemProps) {
  const content = (
    <>
      <span className="material-symbols mr-3 text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </>
  )

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick()
  }

  const sharedProps = {
    id,
    role: 'menuitem' as const,
    tabIndex,
    className,
    'aria-label': ariaLabel,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onClick: handleClick
  }

  if (href) {
    return (
      <Link href={href} {...sharedProps}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" {...sharedProps}>
      {content}
    </button>
  )
}
