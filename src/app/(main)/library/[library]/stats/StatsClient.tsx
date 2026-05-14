'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { filterEncode } from '@/lib/filterUtils'
import { formatDuration } from '@/lib/formatDuration'
import { mergeClasses } from '@/lib/merge-classes'
import { bytesPretty } from '@/lib/string'
import { LibraryStatsResponse } from '@/types/api'
import React from 'react'

interface StatCardProps {
  iconName: string
  value: string | number
  label: string
  iconStyle?: 'py-1' | 'pt-1' // To handle the small vertical offset variations
}

// Component for the top summary metrics (Items, Runtime, Authors, Size, Audio Tracks)
const StatCard: React.FC<StatCardProps> = ({ iconName, value, label, iconStyle = 'py-1' }) => {
  return (
    <div className="flex p-2">
      <span className={`material-symbols text-5xl ${iconStyle}`}>{iconName}</span>
      <div className="px-1">
        <p className="text-4.5xl leading-none font-bold">{value}</p>
        <p className="text-foreground-subdued text-xs md:text-sm">{label}</p>
      </div>
    </div>
  )
}

interface StatsClientProps {
  stats: LibraryStatsResponse
}

export default function StatsClient({ stats }: StatsClientProps) {
  const { library } = useLibrary()
  const t = useTypeSafeTranslations()

  const topGenres = stats.genresWithCount
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((stat) => ({
      label: stat.genre,
      percentage: (stat.count / stats.totalItems) * 100,
      linkHref: `items?filter=genres.${filterEncode(stat.genre)}`
    }))

  const topAuthors = stats.authorsWithCount
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((stat) => ({
      label: `${stat.name}`,
      numBooks: stat.count,
      linkHref: `authors/${stat.id}`
    }))

  const longestItems = stats.longestItems
    .sort((a, b) => b.duration - a.duration)
    .map((stat) => ({
      label: stat.title,
      linkHref: `item/${stat.id}`
    }))

  const largestItems = stats.largestItems
    .sort((a, b) => b.size - a.size)
    .map((stat) => ({
      label: stat.title,
      linkHref: `item/${stat.id}`,
      size: bytesPretty(stat.size)
    }))

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Summary Cards */}
      <div className="mt-6 flex flex-wrap justify-center">
        <StatCard iconName="newsstand" value={stats.totalItems.toLocaleString()} label={t('LabelStatsItemsInLibrary')} iconStyle="py-1" />
        <StatCard
          iconName="show_chart"
          value={formatDuration(stats.totalDuration, t, { largestUnitOnly: true, showDays: true })}
          label={t('LabelStatsOverallRuntime')}
          iconStyle="py-1"
        />
        {library.mediaType === 'book' && (
          <StatCard iconName="person" value={stats.totalAuthors.toLocaleString()} label={t('LabelStatsAuthors')} iconStyle="py-1" />
        )}
        <StatCard iconName="insert_drive_file" value={bytesPretty(stats.totalSize)} label={t('LabelStatsTotalSize')} iconStyle="pt-1" />
        <StatCard iconName="audio_file" value={stats.numAudioTracks.toLocaleString()} label={t('LabelStatsAudioTracks')} iconStyle="pt-1" />
      </div>

      <div className={mergeClasses('mt-8 grid grid-cols-1 gap-8', library.mediaType === 'book' ? 'lg:grid-cols-2' : 'lg:mx-auto lg:max-w-lg')}>
        {/* Top Genres */}
        <div className="w-full">
          <h1 className="mb-4 text-2xl">{t('HeaderStatsTop5Genres')}</h1>
          {topGenres.map((stat, index) => (
            <div key={index} className="w-full py-2">
              <div className="mb-1 flex items-end">
                <p className="text-2xl font-bold">{stat.percentage > 10 ? `${stat.percentage}%` : `${stat.percentage}%`}</p>
                <div className="grow"></div>
                <a href={stat.linkHref} className="text-foreground-subdued ml-2 hover:underline">
                  {stat.label}
                </a>
              </div>
              <div className="bg-primary/50 h-3 w-full overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${stat.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Authors */}
        {library.mediaType === 'book' && (
          <div className="w-full">
            <h1 className="mb-4 text-2xl">{t('HeaderStatsTop10Authors')}</h1>
            {topAuthors.map((stat, index) => (
              <div key={index} className="mb-1 flex w-full items-center py-2 last:border-b-0">
                <span className="text-foreground-subdued pr-1 text-sm">{`${index + 1}. `}</span>
                <a href={stat.linkHref} className="text-foreground-subdued truncate pr-2 text-sm hover:underline">
                  {stat.label}
                </a>
                <div className="h-2.5 grow overflow-hidden rounded-full"></div>
                <div className="ml-3 w-4">
                  <p className="text-sm font-bold">{Math.round(stat.numBooks)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Longest & Largest Comparison */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Longest Items */}
        <div className="w-full">
          <h1 className="mb-4 text-2xl">{t('HeaderStatsLongestItems')}</h1>
          {longestItems.map((stat, index) => (
            <div key={index} className="mb-1 flex w-full items-center justify-between py-2 last:border-b-0">
              <span className="text-foreground-subdued pr-1 text-sm">{`${index + 1}. `}</span>
              <a href={stat.linkHref} className="text-foreground-subdued w-3/4 truncate pr-2 text-sm hover:underline">
                {`${stat.label}`}
              </a>
              <div className="w-1/4 flex-shrink-0 text-right">
                <p className="text-sm font-bold">{formatDuration(stats.longestItems[index].duration, t)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Largest Items */}
        <div className="w-full">
          <h1 className="mb-4 text-2xl">{t('HeaderStatsLargestItems')}</h1>
          {largestItems.map((stat, index) => (
            <div key={index} className="mb-1 flex w-full items-center justify-between py-2 last:border-b-0">
              <span className="text-foreground-subdued pr-1 text-sm">{`${index + 1}. `}</span>
              <a href={stat.linkHref} className="text-foreground-subdued w-3/4 truncate pr-2 text-sm hover:underline">
                {`${stat.label}`}
              </a>
              <div className="w-1/4 flex-shrink-0 text-right">
                {/* Displaying the absolute size directly */}
                <p className="text-sm font-bold whitespace-nowrap">{stat.size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
