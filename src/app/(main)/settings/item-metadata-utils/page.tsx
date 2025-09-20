import Link from 'next/link'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default function ItemMetadataUtilsPage() {
  const items = [
    {
      label: 'Manage Tags',
      href: '/settings/item-metadata-utils/tags'
    },
    {
      label: 'Manage Genres',
      href: '/settings/item-metadata-utils/genres'
    },
    {
      label: 'Manage Custom Metadata Providers',
      href: '/settings/item-metadata-utils/custom-metadata-providers'
    }
  ]
  return (
    <SettingsContent title="Item Metadata Utils">
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
