'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ServerSettings, User, UserLoginResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'
import UsersTable from './UsersTable'

interface UsersClientProps {
  currentUser: UserLoginResponse
  users: User[]
  serverSettings: ServerSettings
}

export default function UsersClient({ currentUser, users, serverSettings }: UsersClientProps) {
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
      <UsersTable currentUser={currentUser} users={users} dateFormat={serverSettings.dateFormat} timeFormat={serverSettings.timeFormat} />
    </SettingsContent>
  )
}
