import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { formatDuration } from '@/lib/formatDuration'
import { bytesPretty } from '@/lib/string'
import type { ServerYearStats, UserYearStats, YearStatsNameTime } from '@/types/api'
import type { TypeSafeTranslations } from '@/types/translations'

const FONT = "'Source Sans Pro', sans-serif"
const ICON_FONT = "'Material Symbols Rounded'"
const ABS_ICON_FONT = 'absicons'
const ABS_LOGO_GLYPH = '\ue900'

const COLORS = {
  background: '#131313',
  accent: '#f6c453',
  text: '#ffffff',
  muted: 'rgba(255, 255, 255, 0.62)',
  tile: 'rgba(255, 255, 255, 0.06)',
  tileBorder: 'rgba(255, 255, 255, 0.1)'
}

const PADDING = 48
const MAX_COVERS_IN_ROW = 5

export type CoverImages = Map<string, HTMLImageElement>

export interface YearInReviewRenderOptions {
  year: number
  t: TypeSafeTranslations
  locale: string
}

type Ctx = CanvasRenderingContext2D

interface TextStyle {
  size: number
  weight?: 300 | 400 | 600
  color?: string
  align?: CanvasTextAlign
  letterSpacing?: number
  maxWidth?: number
}

/** Canvas text silently falls back to a system font if the web font has not been loaded yet. */
export async function loadYearInReviewFonts(): Promise<void> {
  const fonts = [`400 20px ${FONT}`, `600 20px ${FONT}`, `20px ${ICON_FONT}`, `20px ${ABS_ICON_FONT}`]
  await Promise.all(fonts.map((font) => document.fonts.load(font).catch(() => [])))
}

export async function loadCoverImages(libraryItemIds: string[]): Promise<CoverImages> {
  const ids = [...new Set(libraryItemIds)]
  const loaded = await Promise.all(
    ids.map(
      (id) =>
        new Promise<[string, HTMLImageElement] | null>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve([id, img])
          img.onerror = () => resolve(null)
          img.src = getLibraryItemCoverUrl(id)
        })
    )
  )
  return new Map(loaded.filter((entry) => entry !== null))
}

function pickCovers(covers: CoverImages, ids: string[]): HTMLImageElement[] {
  return [...new Set(ids)].map((id) => covers.get(id)).filter((img) => img !== undefined)
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return [canvas, canvas.getContext('2d')!]
}

function truncate(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated.trimEnd()}…`
}

function drawText(ctx: Ctx, text: string | number, x: number, y: number, style: TextStyle) {
  ctx.font = `${style.weight ?? 400} ${style.size}px ${FONT}`
  ctx.fillStyle = style.color ?? COLORS.text
  ctx.textAlign = style.align ?? 'left'
  ctx.letterSpacing = `${style.letterSpacing ?? 0}px`
  const str = String(text)
  ctx.fillText(style.maxWidth ? truncate(ctx, str, style.maxWidth) : str, x, y)
  ctx.letterSpacing = '0px'
}

/**
 * Center a Material Symbol on (centerX, centerY) using ink bounds, not the em-box.
 * Icon fonts pad glyphs unevenly, so middle/center text alignment looks visibly wrong in circles.
 */
function drawIcon(ctx: Ctx, icon: string, centerX: number, centerY: number, size: number, color: string) {
  ctx.save()
  ctx.font = `${size}px ${ICON_FONT}`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const metrics = ctx.measureText(icon)
  const left = metrics.actualBoundingBoxLeft
  const right = metrics.actualBoundingBoxRight
  const ascent = metrics.actualBoundingBoxAscent
  const descent = metrics.actualBoundingBoxDescent
  const hasInkBounds = left + right > 0 && ascent + descent > 0

  ctx.translate(centerX, centerY)
  if (hasInkBounds) {
    ctx.fillText(icon, (left - right) / 2, (ascent - descent) / 2)
  } else {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, 0, 0)
  }
  ctx.restore()
}

function drawSquareImage(ctx: Ctx, img: HTMLImageElement, x: number, y: number, size: number) {
  const side = Math.min(img.width, img.height)
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, x, y, size, size)
}

/** Dim, rotated mosaic of covers under a dark gradient with a warm glow in the top corner */
function drawBackground(ctx: Ctx, width: number, height: number, covers: HTMLImageElement[], tileSize: number) {
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, width, height)

  if (covers.length) {
    const count = Math.ceil(Math.hypot(width, height) / tileSize) + 1
    const offset = (count * tileSize) / 2
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.translate(width / 2, height / 2)
    ctx.rotate((-20 * Math.PI) / 180)
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        const img = covers[(row * count + col) % covers.length]
        drawSquareImage(ctx, img, col * tileSize - offset, row * tileSize - offset, tileSize)
      }
    }
    ctx.restore()
  }

  const shade = ctx.createLinearGradient(0, 0, 0, height)
  shade.addColorStop(0, 'rgba(19, 19, 19, 0.6)')
  shade.addColorStop(0.5, 'rgba(19, 19, 19, 0.82)')
  shade.addColorStop(1, 'rgba(19, 19, 19, 0.94)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)

  const glow = ctx.createRadialGradient(width * 0.1, 0, 0, width * 0.1, 0, Math.max(width, height) * 0.8)
  glow.addColorStop(0, 'rgba(246, 196, 83, 0.24)')
  glow.addColorStop(1, 'rgba(246, 196, 83, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
}

function drawBrand(ctx: Ctx, x: number, y: number, size: number) {
  ctx.font = `${size}px ${ABS_ICON_FONT}`
  ctx.fillStyle = COLORS.accent
  ctx.textAlign = 'left'
  ctx.fillText(ABS_LOGO_GLYPH, x, y)
  drawText(ctx, 'audiobookshelf', x + size * 1.35, y, { size: size * 0.68, color: COLORS.muted })
}

/** Brand row followed by a large year with the "year in review" tag on its baseline */
function drawHeader(ctx: Ctx, { year, t }: YearInReviewRenderOptions) {
  ctx.textBaseline = 'middle'
  drawBrand(ctx, PADDING, 64, 32)

  ctx.textBaseline = 'alphabetic'
  drawText(ctx, year, PADDING, 168, { size: 84, weight: 600 })
  const yearWidth = ctx.measureText(String(year)).width
  drawText(ctx, t('StatsYearInReview'), PADDING + yearWidth + 20, 152, { size: 22, weight: 600, color: COLORS.accent, letterSpacing: 4 })
  ctx.textBaseline = 'middle'
}

function drawTile(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 20)
  ctx.fillStyle = COLORS.tile
  ctx.fill()
  ctx.strokeStyle = COLORS.tileBorder
  ctx.lineWidth = 1
  ctx.stroke()
}

interface StatTile {
  icon: string
  value: string | number
  label: string
}

function drawStatTile(ctx: Ctx, x: number, y: number, w: number, h: number, { icon, value, label }: StatTile, valueSize = 44) {
  drawTile(ctx, x, y, w, h)

  const radius = 26
  const iconCenterX = x + 22 + radius
  const iconCenterY = y + h / 2
  ctx.beginPath()
  ctx.arc(iconCenterX, iconCenterY, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(246, 196, 83, 0.14)'
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(iconCenterX, iconCenterY, radius - 1, 0, Math.PI * 2)
  ctx.clip()
  drawIcon(ctx, icon, iconCenterX, iconCenterY, 30, COLORS.accent)
  ctx.restore()

  const textX = iconCenterX + radius + 18
  const maxWidth = x + w - textX - 16
  drawText(ctx, value, textX, iconCenterY - valueSize * 0.28, { size: valueSize, weight: 600, maxWidth })
  drawText(ctx, label, textX, iconCenterY + valueSize * 0.52, { size: 17, color: COLORS.muted, maxWidth })
}

function drawSectionLabel(ctx: Ctx, text: string, x: number, y: number, maxWidth?: number) {
  drawText(ctx, text, x, y, { size: 14, weight: 600, color: COLORS.accent, letterSpacing: 2, maxWidth })
}

/** Label / value / detail block with an accent bar on the left */
function drawHighlight(ctx: Ctx, x: number, y: number, w: number, label: string, value: string, detail: string) {
  ctx.beginPath()
  ctx.roundRect(x, y + 4, 4, 98, 2)
  ctx.fillStyle = COLORS.accent
  ctx.fill()
  drawSectionLabel(ctx, label, x + 20, y + 18, w - 28)
  drawText(ctx, value, x + 20, y + 54, { size: 30, weight: 600, maxWidth: w - 28 })
  drawText(ctx, detail, x + 20, y + 88, { size: 17, color: COLORS.muted })
}

function drawRankedList(ctx: Ctx, x: number, y: number, w: number, title: string, entries: YearStatsNameTime[], opts: YearInReviewRenderOptions) {
  if (!entries.length) return
  drawSectionLabel(ctx, title, x, y, w)
  entries.slice(0, 3).forEach((entry, i) => {
    const rowY = y + 48 + i * 66
    drawText(ctx, i + 1, x, rowY, { size: 26, weight: 600, color: COLORS.accent })
    drawText(ctx, entry.name, x + 34, rowY, { size: 26, weight: 600, maxWidth: w - 42 })
    drawText(ctx, formatDuration(entry.time, opts.t, { showDays: true }), x + 34, rowY + 26, { size: 16, color: COLORS.muted })
  })
}

function drawCoverRow(ctx: Ctx, y: number, title: string, covers: HTMLImageElement[], canvasWidth: number) {
  if (!covers.length) return
  drawText(ctx, title, PADDING, y, { size: 20, color: COLORS.muted })

  const gap = 16
  const size = (canvasWidth - PADDING * 2 - gap * (MAX_COVERS_IN_ROW - 1)) / MAX_COVERS_IN_ROW
  covers.slice(0, MAX_COVERS_IN_ROW).forEach((img, i) => {
    const x = PADDING + i * (size + gap)
    const top = y + 36

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 8
    ctx.beginPath()
    ctx.roundRect(x, top, size, size, 12)
    ctx.fillStyle = COLORS.background
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, top, size, size, 12)
    ctx.clip()
    drawSquareImage(ctx, img, x, top, size)
    ctx.restore()
  })
}

const toNameTime = (genres: UserYearStats['topGenres']): YearStatsNameTime[] => genres.map(({ genre, time }) => ({ name: genre, time }))

/** 800x800 personal year in review. Variants: 0 highlights, 1 finished covers, 2 top authors & genres */
export function renderUserYearReview(stats: UserYearStats, covers: CoverImages, variant: number, opts: YearInReviewRenderOptions): HTMLCanvasElement {
  const { t, locale, year } = opts
  const size = 800
  const [canvas, ctx] = createCanvas(size, size)
  const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n)
  const duration = (seconds: number) => formatDuration(seconds, t, { showDays: true })

  drawBackground(ctx, size, size, pickCovers(covers, [...stats.finishedBooksWithCovers, ...stats.booksWithCovers]), 200)
  drawHeader(ctx, opts)

  const colWidth = (size - PADDING * 2 - 16) / 2
  const col2 = PADDING + colWidth + 16
  drawStatTile(ctx, PADDING, 212, colWidth, 120, { icon: 'check_circle', value: formatNumber(stats.numBooksFinished), label: t('StatsBooksFinished') })
  drawStatTile(ctx, col2, 212, colWidth, 120, { icon: 'schedule', value: duration(stats.totalListeningTime), label: t('StatsSpentListening') }, 34)
  drawStatTile(ctx, PADDING, 348, colWidth, 120, { icon: 'headphones', value: formatNumber(stats.totalListeningSessions), label: t('StatsSessions') })
  drawStatTile(ctx, col2, 348, colWidth, 120, { icon: 'local_library', value: formatNumber(stats.numBooksListened), label: t('StatsBooksListenedTo') })

  if (variant === 0) {
    const narrator = stats.mostListenedNarrator
    const genre = stats.topGenres[0]
    const author = stats.topAuthors[0]
    const month = stats.mostListenedMonth
    if (narrator) drawHighlight(ctx, PADDING, 510, colWidth, t('StatsTopNarrator'), narrator.name, duration(narrator.time))
    if (genre) drawHighlight(ctx, col2, 510, colWidth, t('StatsTopGenre'), genre.genre, duration(genre.time))
    if (author) drawHighlight(ctx, PADDING, 642, colWidth, t('StatsTopAuthor'), author.name, duration(author.time))
    if (month?.time) {
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month.month, 1))
      drawHighlight(ctx, col2, 642, colWidth, t('StatsTopMonth'), monthName.charAt(0).toLocaleUpperCase(locale) + monthName.slice(1), duration(month.time))
    }
  } else if (variant === 1) {
    drawCoverRow(ctx, 530, t('StatsBooksFinishedThisYear'), pickCovers(covers, stats.finishedBooksWithCovers), size)
  } else {
    drawRankedList(ctx, PADDING, 524, colWidth, t('StatsTopAuthors'), stats.topAuthors, opts)
    drawRankedList(ctx, col2, 524, colWidth, t('StatsTopGenres'), toNameTime(stats.topGenres), opts)
  }

  return canvas
}

/** 600x200 banner with books finished and books listened to */
export function renderUserYearReviewShort(stats: UserYearStats, covers: CoverImages, opts: YearInReviewRenderOptions): HTMLCanvasElement {
  const { t, locale, year } = opts
  const [width, height, padding] = [600, 200, 24]
  const [canvas, ctx] = createCanvas(width, height)
  const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n)

  drawBackground(ctx, width, height, pickCovers(covers, [...stats.finishedBooksWithCovers, ...stats.booksWithCovers]), 150)

  ctx.textBaseline = 'middle'
  drawBrand(ctx, padding, 38, 26)
  drawText(ctx, `${year} ${t('StatsYearInReview')}`, width - padding, 38, { size: 14, weight: 600, color: COLORS.accent, align: 'right', letterSpacing: 2 })

  const tileWidth = (width - padding * 2 - 16) / 2
  drawStatTile(ctx, padding, 68, tileWidth, 108, { icon: 'check_circle', value: formatNumber(stats.numBooksFinished), label: t('StatsBooksFinished') }, 40)
  drawStatTile(
    ctx,
    padding + tileWidth + 16,
    68,
    tileWidth,
    108,
    { icon: 'local_library', value: formatNumber(stats.numBooksListened), label: t('StatsBooksListenedTo') },
    40
  )

  return canvas
}

/** 800x800 server year in review. Variants: 0 added covers, 1 top authors & narrators, 2 top authors & genres */
export function renderServerYearReview(stats: ServerYearStats, covers: CoverImages, variant: number, opts: YearInReviewRenderOptions): HTMLCanvasElement {
  const { t, locale } = opts
  const size = 800
  const [canvas, ctx] = createCanvas(size, size)
  const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n)
  const duration = (seconds: number) => formatDuration(seconds, t, { showDays: true })
  const addedCovers = pickCovers(covers, stats.booksAddedWithCovers)

  drawBackground(ctx, size, size, addedCovers, 200)
  drawHeader(ctx, opts)

  const thirdWidth = (size - PADDING * 2 - 32) / 3
  const tiles: StatTile[] = [
    { icon: 'library_add', value: formatNumber(stats.numBooksAdded), label: t('StatsBooksAdded') },
    { icon: 'person_add', value: formatNumber(stats.numAuthorsAdded), label: t('StatsAuthorsAdded') },
    { icon: 'headphones', value: formatNumber(stats.numListeningSessions), label: t('StatsSessions') }
  ]
  tiles.forEach((tile, i) => drawStatTile(ctx, PADDING + i * (thirdWidth + 16), 212, thirdWidth, 120, tile, 40))

  const colWidth = (size - PADDING * 2 - 16) / 2
  const col2 = PADDING + colWidth + 16
  const growthTiles = [
    stats.totalBooksAddedSize
      ? { x: PADDING, label: t('StatsCollectionGrewTo'), value: bytesPretty(stats.totalBooksSize), delta: bytesPretty(stats.totalBooksAddedSize) }
      : null,
    stats.totalBooksAddedDuration
      ? { x: col2, label: t('StatsTotalDuration'), value: duration(stats.totalBooksDuration), delta: duration(stats.totalBooksAddedDuration) }
      : null
  ]
  growthTiles.forEach((tile) => {
    if (!tile) return
    drawTile(ctx, tile.x, 348, colWidth, 120)
    drawText(ctx, tile.label, tile.x + 24, 378, { size: 16, color: COLORS.muted, maxWidth: colWidth - 48 })
    drawText(ctx, tile.value, tile.x + 24, 414, { size: 32, weight: 600, maxWidth: colWidth - 48 })
    drawText(ctx, `+${tile.delta}`, tile.x + 24, 446, { size: 17, weight: 600, color: COLORS.accent, maxWidth: colWidth - 48 })
  })

  if (variant === 0) {
    drawCoverRow(ctx, 530, t('StatsBooksAdditional'), addedCovers, size)
  } else {
    drawRankedList(ctx, PADDING, 524, colWidth, t('StatsTopAuthors'), stats.topAuthors, opts)
    if (variant === 1) drawRankedList(ctx, col2, 524, colWidth, t('StatsTopNarrators'), stats.topNarrators, opts)
    else drawRankedList(ctx, col2, 524, colWidth, t('StatsTopGenres'), toNameTime(stats.topGenres), opts)
  }

  return canvas
}
