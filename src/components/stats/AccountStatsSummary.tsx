import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getLocale } from 'next-intl/server'

export interface AccountStatsSummaryProps {
  itemsFinished: number
  daysListened: number
  minutesListening: number
}

export default async function AccountStatsSummary({ itemsFinished, daysListened, minutesListening }: AccountStatsSummaryProps) {
  const [t, locale] = await Promise.all([getTypeSafeTranslations(), getLocale()])
  const format = (n: number) => new Intl.NumberFormat(locale).format(n)

  return (
    <div className="flex justify-center">
      <div className="flex p-2">
        <div className="hidden sm:block">
          <span className="material-symbols text-5xl md:text-6xl" aria-hidden="true">
            auto_stories
          </span>
        </div>
        <div className="px-3">
          <p className="text-4xl font-bold md:text-5xl">{format(itemsFinished)}</p>
          <p className="text-foreground-muted text-sm max-sm:text-xs">{t('LabelStatsItemsFinished')}</p>
        </div>
      </div>

      <div className="flex p-2">
        <div className="hidden sm:block">
          <span className="material-symbols text-5xl md:text-6xl" aria-hidden="true">
            event
          </span>
        </div>
        <div className="px-1">
          <p className="text-4xl font-bold md:text-5xl">{format(daysListened)}</p>
          <p className="text-foreground-muted text-sm max-sm:text-xs">{t('LabelStatsDaysListened')}</p>
        </div>
      </div>

      <div className="flex p-2">
        <div className="hidden sm:block">
          <span className="material-symbols text-5xl md:text-6xl" aria-hidden="true">
            watch_later
          </span>
        </div>
        <div className="px-1">
          <p className="text-4xl font-bold md:text-5xl">{format(minutesListening)}</p>
          <p className="text-foreground-muted text-sm max-sm:text-xs">{t('LabelStatsMinutesListening')}</p>
        </div>
      </div>
    </div>
  )
}
