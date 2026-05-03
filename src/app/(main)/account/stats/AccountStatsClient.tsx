'use client'

import ListeningHeatmap from '@/components/stats/ListeningHeatmap'

interface AccountStatsClientProps {
  daysListening: Record<string, number>
}

export default function AccountStatsClient({ daysListening }: AccountStatsClientProps) {
  return <ListeningHeatmap daysListening={daysListening} />
}
