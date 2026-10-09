'use client'

import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'
import Tooltip from '@/components/ui/Tooltip'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { downloadByUrl } from '@/lib/download'
import { mergeClasses } from '@/lib/merge-classes'
import {
  CoverImages,
  loadCoverImages,
  loadYearInReviewFonts,
  renderServerYearReview,
  renderUserYearReview,
  renderUserYearReviewShort,
  YearInReviewRenderOptions
} from '@/lib/yearInReviewCanvas'
import { ServerYearStats, UserYearStats } from '@/types/api'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getServerYearStats, getUserYearStats } from './actions'

const VARIANT_ITEMS = [0, 1, 2].map((value) => ({ text: String(value + 1), value }))

const userCoverIds = (stats: UserYearStats) => [...stats.finishedBooksWithCovers, ...stats.booksWithCovers]
const serverCoverIds = (stats: ServerYearStats) => stats.booksAddedWithCovers

/** Share is only available in some browsers; detect after mount so SSR/hydration stay consistent. */
function useCanShare() {
  const [canShare, setCanShare] = useState(false)
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function')
  }, [])
  return canShare
}

interface YearData<T> {
  stats: T
  covers: CoverImages
}

function useYearData<T>(fetchStats: (year: number) => Promise<T>, getCoverIds: (stats: T) => string[]) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [data, setData] = useState<YearData<T> | null>(null)
  const [loading, setLoading] = useState(false)
  const latestRequest = useRef(0)

  const load = useCallback(
    async (year: number) => {
      const request = ++latestRequest.current
      setLoading(true)
      try {
        const stats = await fetchStats(year)
        const [covers] = await Promise.all([loadCoverImages(getCoverIds(stats)), loadYearInReviewFonts()])
        if (request === latestRequest.current) setData({ stats, covers })
      } catch (error) {
        console.error('Failed to load year in review stats', error)
        if (request === latestRequest.current) {
          setData(null)
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
        }
      } finally {
        if (request === latestRequest.current) setLoading(false)
      }
    },
    [fetchStats, getCoverIds, showToast, t]
  )

  return { data, loading, load }
}

interface ReviewCardProps {
  title?: string
  canvas: HTMLCanvasElement | null
  loading: boolean
  fileName: string
  aspectRatio: string
  variant?: number
  onVariantChange?: (variant: number) => void
  onRefresh: () => void
  className?: string
}

function ReviewCard({ title, canvas, loading, fileName, aspectRatio, variant, onVariantChange, onRefresh, className }: ReviewCardProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const canShare = useCanShare()
  const dataUrl = useMemo(() => canvas?.toDataURL('image/png') ?? null, [canvas])
  const busy = loading || !canvas

  const share = () => {
    canvas?.toBlob(async (blob) => {
      if (!blob) return
      const shareData = { files: [new File([blob], fileName, { type: blob.type })] }
      if (!navigator.canShare?.(shareData)) {
        showToast(t('ToastErrorCannotShare'), { type: 'error' })
        return
      }
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          showToast(`${t('ToastFailedToShare')}: ${error.message}`, { type: 'error' })
        }
      }
    })
  }

  return (
    <div className={mergeClasses('flex min-w-0 flex-col gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-2 sm:h-9 sm:flex-row sm:items-center">
        {title ? (
          <h3 className="text-foreground-muted text-base font-semibold max-sm:text-center max-sm:leading-snug sm:min-w-0 sm:flex-1 sm:truncate">{title}</h3>
        ) : null}
        <div className={mergeClasses('flex shrink-0 flex-wrap items-center gap-2 max-sm:justify-center', !title && 'sm:ms-auto')}>
          {variant !== undefined && onVariantChange && (
            <div className="w-fit shrink-0 [&>div]:w-auto">
              <ToggleButtonGroup
                size="small"
                items={VARIANT_ITEMS}
                value={variant}
                disabled={busy}
                ariaLabel={title}
                onChange={(value) => onVariantChange(Number(value))}
              />
            </div>
          )}
          <Tooltip text={t('ButtonRefresh')} position="bottom">
            <IconBtn size="small" borderless loading={loading} ariaLabel={t('ButtonRefresh')} onClick={onRefresh}>
              refresh
            </IconBtn>
          </Tooltip>
          {canShare && (
            <Tooltip text={t('ButtonShare')} position="bottom">
              <IconBtn size="small" borderless disabled={busy} ariaLabel={t('ButtonShare')} onClick={share}>
                share
              </IconBtn>
            </Tooltip>
          )}
          <Tooltip text={t('LabelDownload')} position="bottom">
            <IconBtn
              size="small"
              borderless
              disabled={busy}
              ariaLabel={t('LabelDownload')}
              onClick={() => dataUrl && downloadByUrl(dataUrl, { filename: fileName })}
            >
              download
            </IconBtn>
          </Tooltip>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl bg-[#131313] shadow-lg" style={{ aspectRatio }} aria-busy={loading || undefined}>
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={title ?? t('StatsYearInReview')}
            className={mergeClasses('h-full w-full transition-[opacity,filter] duration-300', loading && 'opacity-40 blur-[2px]')}
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white" role="status">
            <LoadingSpinner size="la-2x" />
            <span className="text-sm text-white/80">{t('MessageLoading')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function getAvailableYears(userCreatedAt: number): number[] {
  const currentYear = new Date().getFullYear()
  const oldestYear = userCreatedAt ? Math.min(new Date(userCreatedAt).getFullYear(), currentYear) : currentYear
  return Array.from({ length: currentYear - oldestYear + 1 }, (_, i) => currentYear - i)
}

interface YearInReviewProps {
  userCreatedAt: number
  isAdmin: boolean
}

export default function YearInReview({ userCreatedAt, isAdmin }: YearInReviewProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const availableYears = useMemo(() => getAvailableYears(userCreatedAt), [userCreatedAt])
  const [year, setYear] = useState(() => {
    // Outside December the previous year is the more complete review
    const currentYear = new Date().getFullYear()
    return new Date().getMonth() < 11 && availableYears.includes(currentYear - 1) ? currentYear - 1 : currentYear
  })
  const [open, setOpen] = useState(false)
  const [userVariant, setUserVariant] = useState(0)
  const [serverVariant, setServerVariant] = useState(0)

  const user = useYearData(getUserYearStats, userCoverIds)
  const server = useYearData(getServerYearStats, serverCoverIds)

  const loadYear = (targetYear: number) => {
    user.load(targetYear)
    if (isAdmin) server.load(targetYear)
  }

  const toggleOpen = () => {
    if (!open && !user.data && !user.loading) loadYear(year)
    setOpen(!open)
  }

  const changeYear = (value: string | number) => {
    setYear(Number(value))
    loadYear(Number(value))
  }

  const renderOptions: YearInReviewRenderOptions = useMemo(() => ({ year, t, locale }), [year, t, locale])
  const userStats = user.data?.stats
  const userCovers = user.data?.covers
  const userCanvas = useMemo(
    () => (userStats && userCovers ? renderUserYearReview(userStats, userCovers, userVariant, renderOptions) : null),
    [userStats, userCovers, userVariant, renderOptions]
  )
  const userShortCanvas = useMemo(
    () => (userStats && userCovers ? renderUserYearReviewShort(userStats, userCovers, renderOptions) : null),
    [userStats, userCovers, renderOptions]
  )
  const serverStats = server.data?.stats
  const serverCovers = server.data?.covers
  const serverCanvas = useMemo(
    () => (serverStats && serverCovers ? renderServerYearReview(serverStats, serverCovers, serverVariant, renderOptions) : null),
    [serverStats, serverCovers, serverVariant, renderOptions]
  )

  return (
    <section className="border-border overflow-hidden rounded-2xl border bg-linear-to-br from-amber-400/5 via-transparent to-transparent">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <span className="material-symbols rounded-xl bg-amber-400/10 p-2 text-xl text-amber-500/90" aria-hidden="true">
          auto_awesome
        </span>
        <h2 className="min-w-0 grow text-xl font-semibold">{t('HeaderYearReview', { 0: year })}</h2>
        {open && availableYears.length > 1 && (
          <Dropdown
            size="small"
            className="w-24"
            ariaLabel={t('HeaderYearReview', { 0: year })}
            value={year}
            items={availableYears.map((y) => ({ text: String(y), value: y }))}
            disabled={user.loading || server.loading}
            onChange={changeYear}
          />
        )}
        <Btn size="small" className="max-sm:w-full max-sm:justify-center" onClick={toggleOpen} ariaExpanded={open}>
          {open ? t('LabelYearReviewHide') : t('LabelYearReviewShow')}
        </Btn>
      </div>

      {open && (
        <div className="border-border flex flex-col gap-8 border-t p-4 *:mx-auto *:w-full *:max-w-2xl sm:p-5">
          <ReviewCard
            title={t('LabelPersonalYearReview', { 0: userVariant + 1 })}
            canvas={userCanvas}
            loading={user.loading}
            fileName="yearinreview.png"
            aspectRatio="4 / 5"
            variant={userVariant}
            onVariantChange={setUserVariant}
            onRefresh={() => user.load(year)}
          />
          <ReviewCard canvas={userShortCanvas} loading={user.loading} fileName="yearinreviewshort.png" aspectRatio="3 / 1" onRefresh={() => user.load(year)} />
          {isAdmin && (
            <ReviewCard
              className="border-border border-t pt-8"
              title={t('LabelServerYearReview', { 0: serverVariant + 1 })}
              canvas={serverCanvas}
              loading={server.loading}
              fileName="yearinreviewserver.png"
              aspectRatio="4 / 5"
              variant={serverVariant}
              onVariantChange={setServerVariant}
              onRefresh={() => server.load(year)}
            />
          )}
        </div>
      )}
    </section>
  )
}
