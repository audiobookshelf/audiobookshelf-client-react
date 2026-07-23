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
  onClick?: () => void
  ref: (el: HTMLAnchorElement | HTMLButtonElement | null) => void
}

export default function AppBarNavMenuItem({ id, className, ariaLabel, tabIndex, icon, label, href, onClick, ref }: AppBarNavMenuItemProps) {
  const content = (
    <>
      <span className="material-symbols mr-3 text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </>
  )

  const sharedProps = {
    id,
    role: 'menuitem' as const,
    tabIndex,
    className,
    'aria-label': ariaLabel,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault()
  }

  if (href) {
    return (
      <Link ref={ref} href={href} {...sharedProps} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button ref={ref} type="button" {...sharedProps} onClick={onClick}>
      {content}
    </button>
  )
}
