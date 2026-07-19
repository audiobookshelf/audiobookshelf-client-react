'use client'

import ListeningSessionsTable from '@/app/(main)/settings/listening-sessions/ListeningSessionsTable'
import OnlineIndicator from '@/components/widgets/OnlineIndicator'
import { useSocket } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetListeningSessionsResponse, GetOpenListeningSessionsResponse, User } from '@/types/api'
import Link from 'next/link'
import SettingsContent from '../SettingsContent'

interface ListeningSessionsClientProps {
  users: User[]
  sessionsResponse: GetListeningSessionsResponse
  openSessionsResponse: GetOpenListeningSessionsResponse
  userFilter?: string
  filteredUser?: User | null
}

export default function ListeningSessionsClient({ users, sessionsResponse, openSessionsResponse, userFilter, filteredUser }: ListeningSessionsClientProps) {
  const t = useTypeSafeTranslations()
  const { user: currentUser } = useUser()
  const { getIsUserOnline } = useSocket()

  if (userFilter && filteredUser) {
    return (
      <div className="mx-auto w-full max-w-4xl p-2 md:p-6">
        <div className="bg-bg mb-8 rounded-md border border-white/5 p-2 shadow-lg sm:p-4">
          <Link
            href={`/settings/users/${userFilter}`}
            className="text-foreground-muted hover:text-foreground hover:bg-bg-hover flex items-center rounded-full px-2 sm:px-0"
          >
            <span className="flex h-10 w-10 items-center justify-center">
              <span className="material-symbols text-2xl">arrow_back</span>
            </span>
            <span className="pl-1">{t('LabelBackToUser')}</span>
          </Link>

          <div className="mt-4 mb-2 flex items-center px-2 sm:px-0">
            <OnlineIndicator value={filteredUser.id === currentUser.id || getIsUserOnline(filteredUser.id)} />
            <h1 className="pl-2 text-xl">{filteredUser.username}</h1>
          </div>

          <div className="bg-border my-2 h-px w-full" />

          <div className="py-2">
            <h2 className="text-foreground/90 mb-2 px-2 text-lg font-medium sm:px-0">{t('HeaderListeningSessions')}</h2>
            <ListeningSessionsTable users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} lockedUserId={userFilter} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <SettingsContent title={t('HeaderListeningSessions')}>
      <ListeningSessionsTable users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} lockedUserId={userFilter} />
    </SettingsContent>
  )
}
