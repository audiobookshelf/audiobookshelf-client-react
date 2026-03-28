'use client'

import ListeningSessionsTable from '@/app/(main)/settings/listening-sessions/ListeningSessionsTable'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetListeningSessionsResponse, GetOpenListeningSessionsResponse, User } from '@/types/api'
import SettingsContent from '../SettingsContent'

interface ListeningSessionsClientProps {
  users: User[]
  sessionsResponse: GetListeningSessionsResponse
  openSessionsResponse: GetOpenListeningSessionsResponse
}

export default function ListeningSessionsClient({ users, sessionsResponse, openSessionsResponse }: ListeningSessionsClientProps) {
  const t = useTypeSafeTranslations()

  return (
    <SettingsContent title={t('HeaderListeningSessions')}>
      <ListeningSessionsTable users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} />
    </SettingsContent>
  )
}
