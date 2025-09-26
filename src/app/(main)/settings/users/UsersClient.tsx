'use client'

import Link from 'next/link'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export default function UsersClient(props: { users: any[] }) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent
      title={t('HeaderUsers')}
      moreInfoUrl="https://www.audiobookshelf.org/guides/users"
      addButton={{
        label: t('ButtonAddUser'),
        onClick: () => {
          console.log('Add User')
        }
      }}
    >
      <div className="flex flex-col gap-2 py-4">
        {props.users.map((user: any) => (
          <div key={user.id}>
            <Link href={`/settings/users/${user.id}`} className="text-gray-300 hover:text-white">
              {user.username}
            </Link>
          </div>
        ))}
      </div>
    </SettingsContent>
  )
}
