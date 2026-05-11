'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { PlaybackSession } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'

function sessionTitle(session: PlaybackSession): string {
  if (session.displayTitle?.trim()) return session.displayTitle
  const meta = session.mediaMetadata as { title?: string } | undefined
  return String(meta?.title ?? '')
}

export interface RecentListeningSessionsProps {
  sessions: PlaybackSession[]
  userId: string
  showViewAll: boolean
}

export default function RecentListeningSessions({ sessions, userId, showViewAll }: RecentListeningSessionsProps) {
  const t = useTypeSafeTranslations()
  const viewAllTo = `/settings/listening-sessions?user=${encodeURIComponent(userId)}`

  return (
    <div className="mx-auto w-full md:mx-0 md:w-80 md:shrink-0">
      <div className="mb-4 flex items-center">
        <h2 className="text-2xl">{t('HeaderStatsRecentSessions')}</h2>
        <div className="grow" />
        {showViewAll ? (
          <Btn to={viewAllTo} size="small" className="h-7 text-xs">
            {t('ButtonViewAll')}
          </Btn>
        ) : null}
      </div>

      {!sessions.length ? (
        <p className="text-foreground-muted text-sm">{t('MessageNoListeningSessions')}</p>
      ) : (
        <ul className="space-y-1.5">
          {sessions.map((item, index) => (
            <li key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="text-foreground-muted w-8 shrink-0 text-sm tabular-nums">{index + 1}.</span>
                  <div className="max-w-[14rem] min-w-0">
                    <p className="text-foreground truncate text-sm">{sessionTitle(item)}</p>
                    <p className="text-foreground-subdued text-xs">{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>
                  </div>
                </div>
                <p className="text-foreground w-[4.5rem] shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatDuration(item.timeListening, t, { showSeconds: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
