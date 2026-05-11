'use client'

import DailyListeningChart from '@/components/stats/DailyListeningChart'
import ListeningHeatmap from '@/components/stats/ListeningHeatmap'
import RecentListeningSessions from '@/components/stats/RecentListeningSessions'
import { PlaybackSession } from '@/types/api'

interface AccountStatsClientProps {
  daysListening: Record<string, number>
  recentSessions: PlaybackSession[]
  userId: string
  showViewAllSessions: boolean
}

export default function AccountStatsClient({ daysListening, recentSessions, userId, showViewAllSessions }: AccountStatsClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 overflow-hidden md:flex-row md:items-start">
        <DailyListeningChart daysListening={daysListening} />
        <RecentListeningSessions sessions={recentSessions} userId={userId} showViewAll={showViewAllSessions} />
      </div>
      <ListeningHeatmap daysListening={daysListening} />
    </div>
  )
}
