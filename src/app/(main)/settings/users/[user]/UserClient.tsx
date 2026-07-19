'use client'

import { fetchUserListeningSessions, fetchUserListeningStats } from '@/app/(main)/settings/users/actions'
import PreviewCover from '@/components/covers/PreviewCover'
import Btn from '@/components/ui/Btn'
import SimpleDataTable, { DataTableColumn } from '@/components/ui/SimpleDataTable'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import OnlineIndicator from '@/components/widgets/OnlineIndicator'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useSocket } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { formatJsDatetime } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
import { GetListeningSessionsResponse, ListeningStats, MediaProgress, PlaybackSession, User } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import UserListeningStatsSkeleton from './UserListeningStatsSkeleton'

const legacyTokenTags = {
  apiKeysLink: (chunks: React.ReactNode) => (
    <Link href="/settings/api-keys" className="text-blue-400 hover:text-blue-300 hover:underline">
      {chunks}
    </Link>
  )
}

const COVER_WIDTH = 50

const EMPTY_LISTENING_STATS: ListeningStats = {
  totalTime: 0,
  items: {},
  days: {},
  dayOfWeek: {},
  today: 0,
  recentSessions: []
}

const EMPTY_LISTENING_SESSIONS: GetListeningSessionsResponse = {
  total: 0,
  numPages: 0,
  page: 0,
  itemsPerPage: 10,
  sessions: []
}

export default function UserClient({ user }: { user: User }) {
  const t = useTypeSafeTranslations()
  const { getIsUserOnline } = useSocket()
  const { user: currentUser, serverSettings } = useUser()
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const [listeningStats, setListeningStats] = useState<ListeningStats>(EMPTY_LISTENING_STATS)
  const [listeningSessions, setListeningSessions] = useState<GetListeningSessionsResponse>(EMPTY_LISTENING_SESSIONS)
  const [isListeningDataLoaded, setIsListeningDataLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsListeningDataLoaded(false)

    const loadListeningData = async () => {
      const loadStats = async () => {
        try {
          return await fetchUserListeningStats(user.id)
        } catch (error) {
          console.error('Failed to load user listening stats', error)
          return EMPTY_LISTENING_STATS
        }
      }

      const loadSessions = async () => {
        try {
          return await fetchUserListeningSessions(user.id, 'page=0&itemsPerPage=10')
        } catch (error) {
          console.error('Failed to load user listening sessions', error)
          return EMPTY_LISTENING_SESSIONS
        }
      }

      const [stats, sessions] = await Promise.all([loadStats(), loadSessions()])

      if (cancelled) return

      setListeningStats(stats)
      setListeningSessions(sessions)
      setIsListeningDataLoaded(true)
    }

    void loadListeningData()

    return () => {
      cancelled = true
    }
  }, [user.id])

  const sortedMediaProgress = useMemo(() => [...user.mediaProgress].sort((a, b) => b.lastUpdate - a.lastUpdate), [user.mediaProgress])

  const latestSession: PlaybackSession | null = listeningSessions.sessions?.[0] ?? null

  const columns: DataTableColumn<MediaProgress>[] = [
    {
      label: '',
      headerClassName: 'w-16',
      cellClassName: 'py-1',
      accessor: (mediaProgress) => {
        const coverHeight = COVER_WIDTH * bookCoverAspectRatio
        if (!mediaProgress.coverPath) {
          return (
            <div
              className="bg-primary text-foreground-muted flex items-center justify-center p-1 text-center text-xs"
              style={{ width: COVER_WIDTH, height: coverHeight }}
            >
              No Cover
            </div>
          )
        }

        return (
          <PreviewCover
            src={getLibraryItemCoverUrl(mediaProgress.libraryItemId, mediaProgress.mediaUpdatedAt)}
            width={COVER_WIDTH}
            bookCoverAspectRatio={bookCoverAspectRatio}
            showResolution={false}
          />
        )
      }
    },
    {
      label: t('LabelItem'),
      accessor: (mediaProgress) => (
        <div>
          <p>{mediaProgress.displayTitle || 'Unknown'}</p>
          {mediaProgress.displaySubtitle ? <p className="text-foreground-muted font-sans text-xs">{mediaProgress.displaySubtitle}</p> : null}
        </div>
      )
    },
    {
      label: t('LabelProgress'),
      accessor: (mediaProgress) => `${Math.floor(mediaProgress.progress * 100)}%`,
      cellClassName: 'text-center',
      headerClassName: 'text-center'
    },
    {
      label: t('LabelStartedAt'),
      hiddenBelow: 'sm',
      cellClassName: 'text-center',
      headerClassName: 'text-center',
      accessor: (mediaProgress) => {
        if (!mediaProgress.startedAt) return ''
        return (
          <Tooltip lazy text={formatJsDatetime(new Date(mediaProgress.startedAt), dateFormat, timeFormat)} position="top">
            <span className="text-sm">{formatDistanceToNow(new Date(mediaProgress.startedAt), { addSuffix: true })}</span>
          </Tooltip>
        )
      }
    },
    {
      label: t('LabelLastUpdate'),
      hiddenBelow: 'sm',
      cellClassName: 'text-center',
      headerClassName: 'text-center',
      accessor: (mediaProgress) => {
        if (!mediaProgress.lastUpdate) return ''
        return (
          <Tooltip lazy text={formatJsDatetime(new Date(mediaProgress.lastUpdate), dateFormat, timeFormat)} position="top">
            <span className="text-sm">{formatDistanceToNow(new Date(mediaProgress.lastUpdate), { addSuffix: true })}</span>
          </Tooltip>
        )
      }
    }
  ]

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <OnlineIndicator value={user.id === currentUser.id || getIsUserOnline(user.id)} />
        <h1 className="text-xl">{user.username}</h1>
      </div>

      {user.token ? (
        <div className="mt-4 space-y-2 text-xs">
          <TextInput label={t('LabelLegacyApiToken')} value={user.token} readOnly showCopy />
          <p className="text-warning">{t.rich('MessageAuthenticationLegacyTokenWarning', legacyTokenTags)}</p>
        </div>
      ) : null}

      <div className="bg-border my-2 h-px w-full" />

      {!isListeningDataLoaded ? (
        <UserListeningStatsSkeleton />
      ) : (
        <div className="py-2">
          <h2 className="mb-2 text-lg font-medium">{t('HeaderListeningStats')}</h2>
          <div className="flex items-center gap-2">
            <p className="text-foreground-muted text-sm">
              {listeningSessions.total} {t('HeaderListeningSessions')}
            </p>
            <Btn to={`/settings/listening-sessions?user=${encodeURIComponent(user.id)}`} size="small" className="h-7 text-xs">
              {t('ButtonViewAll')}
            </Btn>
          </div>
          <p className="text-foreground-muted text-sm">
            {t('LabelTotalTimeListened')}:{' '}
            <span className="text-foreground font-mono text-base">
              {formatDuration(listeningStats.totalTime ?? 0, t, { showDays: true })}
              {listeningStats.today ? <> ({formatDuration(listeningStats.today, t, { showDays: true })} today)</> : null}
            </span>
          </p>

          {latestSession ? (
            <div className="mt-4">
              <h2 className="mb-2 text-lg font-medium">{t('HeaderLastListeningSession')}</h2>
              <p className="text-foreground-muted text-sm">
                <strong className="text-foreground">{latestSession.displayTitle}</strong>{' '}
                {formatDistanceToNow(new Date(latestSession.updatedAt), { addSuffix: true })} for{' '}
                <span className="text-foreground font-mono text-base">
                  {formatDuration(latestSession.timeListening, t, { showDays: true, showSeconds: true })}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="bg-border my-2 h-px w-full" />

      <div className="py-2">
        <h2 className="mb-2 text-lg font-medium">{t('HeaderSavedMediaProgress')}</h2>
        {sortedMediaProgress.length > 0 ? (
          <SimpleDataTable
            data={sortedMediaProgress}
            columns={columns}
            getRowKey={(mediaProgress) => mediaProgress.id}
            rowClassName={(mediaProgress) => (mediaProgress.isFinished ? 'bg-success/10 even:bg-success/10 hover:bg-success/5' : '')}
          />
        ) : (
          <p className="text-foreground py-8 text-center text-lg">{t('MessageNoMediaProgress')}</p>
        )}
      </div>
    </div>
  )
}
