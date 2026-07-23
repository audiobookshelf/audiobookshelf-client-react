import type { TypeSafeTranslations } from '@/types/translations'

export type AppBarNavMenuItemType = 'link' | 'logout'

export interface AppBarNavMenuItemConfig {
  id: string
  type: AppBarNavMenuItemType
  href?: string
  label: string
  ariaLabel: string
  icon: string
  mobileOnly?: boolean
  className?: string
}

export interface BuildAppBarNavMenuItemsParams {
  username: string
  isAdmin: boolean
  userCanUpload: boolean
  t: TypeSafeTranslations
}

export function buildAppBarNavMenuItems({ username, isAdmin, userCanUpload, t }: BuildAppBarNavMenuItemsParams): AppBarNavMenuItemConfig[] {
  const items: AppBarNavMenuItemConfig[] = [
    {
      id: 'account',
      type: 'link',
      href: '/account',
      label: username,
      ariaLabel: t('HeaderAccount'),
      icon: 'person',
      className: 'border-border border-b'
    }
  ]

  if (isAdmin) {
    items.push({
      id: 'settings',
      type: 'link',
      href: '/settings',
      label: t('HeaderSettings'),
      ariaLabel: t('HeaderSettings'),
      icon: 'settings',
      mobileOnly: true
    })
  }

  if (userCanUpload) {
    items.push({
      id: 'upload',
      type: 'link',
      href: '/upload',
      label: t('ButtonUpload'),
      ariaLabel: t('ButtonUpload'),
      icon: 'upload',
      mobileOnly: true
    })
  }

  items.push(
    {
      id: 'stats',
      type: 'link',
      href: '/account/stats',
      label: t('ButtonStats'),
      ariaLabel: t('ButtonStats'),
      icon: 'equalizer'
    },
    {
      id: 'components-catalog',
      type: 'link',
      href: '/components_catalog',
      label: t('ButtonComponentsCatalog'),
      ariaLabel: t('ButtonComponentsCatalog'),
      icon: 'widgets'
    },
    {
      id: 'logout',
      type: 'logout',
      label: t('ButtonLogout'),
      ariaLabel: t('ButtonLogout'),
      icon: 'logout'
    }
  )

  return items
}
