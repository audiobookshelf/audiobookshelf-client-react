'use client'

import DailyListeningChart from '@/components/stats/DailyListeningChart'
import ListeningHeatmap from '@/components/stats/ListeningHeatmap'

interface AccountStatsClientProps {
  daysListening: Record<string, number>
}

export default function AccountStatsClient({ daysListening }: AccountStatsClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <DailyListeningChart daysListening={daysListening} />
      <ListeningHeatmap daysListening={daysListening} />
    </div>
  )
}
