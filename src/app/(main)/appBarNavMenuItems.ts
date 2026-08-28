import type { TypeSafeTranslations } from '@/types/translations'

// TODO: Move non-user-specific items (components catalog) out of this menu builder.

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
  t: TypeSafeTranslations
}

export function buildAppBarNavMenuItems({ username, t }: BuildAppBarNavMenuItemsParams): AppBarNavMenuItemConfig[] {
  return [
    {
      id: 'account',
      type: 'link',
      href: '/account',
      label: username,
      ariaLabel: t('HeaderAccount'),
      icon: 'person',
      className: 'border-border border-b'
    },
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
  ]
}
