import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import Link from 'next/link'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsPage() {
  const t = await getTypeSafeTranslations()
  const items = [
    {
      label: t('HeaderManageTags'),
      href: '/settings/item-metadata-utils/tags'
    },
    {
      label: t('HeaderManageGenres'),
      href: '/settings/item-metadata-utils/genres'
    },
    {
      label: t('HeaderCustomMetadataProviders'),
      href: '/settings/item-metadata-utils/custom-metadata-providers'
    }
  ]
  return (
    <SettingsContent title={t('HeaderItemMetadataUtils')}>
      <div className="flex flex-col gap-2 py-4">
        {items.map((item) => (
          <Link href={item.href} className="bg-primary/40 hover:bg-primary/60 p-4 text-gray-300 hover:text-white rounded-md">
            <div className="flex items-center justify-between">
              <span>{item.label}</span>
              <span className="material-symbols text-xl">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
    </SettingsContent>
  )
}
