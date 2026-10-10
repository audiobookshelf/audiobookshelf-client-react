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

/**
 * Personal and server reviews are 4:5 portrait images drawn on an 800x1000 grid and exported at 1080x1350.
 * Their y-coordinates and font sizes are written on an 800x800 grid and multiplied by PORTRAIT_SCALE.
 */
const WIDTH = 800
const PORTRAIT_HEIGHT = 1000
const PORTRAIT_SCALE = 1.25
const PORTRAIT_PIXEL_RATIO = 1.35
const COVER_COLUMNS = 3

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
  /** Shrink the font (down to 70%) to fit maxWidth before truncating */
  fit?: boolean
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

function createCanvas(width: number, height: number, pixelRatio = 1): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  const ctx = canvas.getContext('2d')!
  ctx.scale(pixelRatio, pixelRatio)
  return [canvas, ctx]
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
  const str = String(text)
  const setFont = (size: number) => (ctx.font = `${style.weight ?? 400} ${size}px ${FONT}`)
  setFont(style.size)
  ctx.fillStyle = style.color ?? COLORS.text
  ctx.textAlign = style.align ?? 'left'
  ctx.letterSpacing = `${style.letterSpacing ?? 0}px`
  if (style.fit && style.maxWidth) {
    const width = ctx.measureText(str).width
    // Glyph widths do not scale exactly linearly with font size, so leave a small margin
    if (width > style.maxWidth) setFont(Math.max(style.size * 0.7, (style.size * style.maxWidth * 0.97) / width))
  }
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
function drawHeader(ctx: Ctx, { year, t }: YearInReviewRenderOptions, s: number) {
  ctx.textBaseline = 'middle'
  drawBrand(ctx, PADDING, 64 * s, 32 * s)

  ctx.textBaseline = 'alphabetic'
  drawText(ctx, year, PADDING, 168 * s, { size: 84 * s, weight: 600 })
  const tagX = PADDING + ctx.measureText(String(year)).width + 20 * s
  drawText(ctx, t('StatsYearInReview'), tagX, 152 * s, {
    size: 22 * s,
    weight: 600,
    color: COLORS.accent,
    letterSpacing: 4,
    maxWidth: WIDTH - PADDING - tagX,
    fit: true
  })
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

interface StatTileOptions {
  valueSize?: number
  /** Unscaled icon circle radius; padding around the icon follows it so narrow tiles keep room for text */
  iconRadius?: number
  s?: number
}

function drawStatTile(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  { icon, value, label }: StatTile,
  { valueSize = 44, iconRadius = 26, s = 1 }: StatTileOptions = {}
) {
  drawTile(ctx, x, y, w, h)

  const radius = iconRadius * s
  const iconCenterX = x + radius * 0.85 + radius
  const iconCenterY = y + h / 2
  ctx.beginPath()
  ctx.arc(iconCenterX, iconCenterY, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(246, 196, 83, 0.14)'
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(iconCenterX, iconCenterY, radius - 1, 0, Math.PI * 2)
  ctx.clip()
  drawIcon(ctx, icon, iconCenterX, iconCenterY, radius * 1.15, COLORS.accent)
  ctx.restore()

  const textX = iconCenterX + radius + radius * 0.7
  const maxWidth = x + w - textX - 14
  drawText(ctx, value, textX, iconCenterY - valueSize * 0.3, { size: valueSize, weight: 600, maxWidth, fit: true })
  drawText(ctx, label, textX, iconCenterY + valueSize * 0.55, { size: 20 * s, weight: 600, color: COLORS.muted, maxWidth, fit: true })
}

function drawSectionLabel(ctx: Ctx, text: string, x: number, y: number, s: number, maxWidth?: number) {
  drawText(ctx, text, x, y, { size: 16 * s, weight: 600, color: COLORS.accent, letterSpacing: 2, maxWidth, fit: true })
}

/** Label / value / detail block with an accent bar on the left */
function drawHighlight(ctx: Ctx, x: number, y: number, w: number, label: string, value: string, detail: string, s: number) {
  ctx.beginPath()
  ctx.roundRect(x, y + 4 * s, 4, 98 * s, 2)
  ctx.fillStyle = COLORS.accent
  ctx.fill()
  drawSectionLabel(ctx, label, x + 20, y + 18 * s, s, w - 28)
  drawText(ctx, value, x + 20, y + 54 * s, { size: 30 * s, weight: 600, maxWidth: w - 28, fit: true })
  drawText(ctx, detail, x + 20, y + 90 * s, { size: 21 * s, color: COLORS.muted, maxWidth: w - 28, fit: true })
}

function drawRankedList(ctx: Ctx, x: number, y: number, w: number, title: string, entries: YearStatsNameTime[], opts: YearInReviewRenderOptions, s: number) {
  if (!entries.length) return
  drawSectionLabel(ctx, title, x, y, s, w)
  entries.slice(0, 3).forEach((entry, i) => {
    const rowY = y + (48 + i * 66) * s
    const nameX = x + 34 * s
    drawText(ctx, i + 1, x, rowY, { size: 26 * s, weight: 600, color: COLORS.accent })
    drawText(ctx, entry.name, nameX, rowY, { size: 26 * s, weight: 600, maxWidth: x + w - nameX - 8, fit: true })
    drawText(ctx, formatDuration(entry.time, opts.t, { showDays: true }), nameX, rowY + 30 * s, { size: 20 * s, color: COLORS.muted })
  })
}

function drawCoverRow(ctx: Ctx, y: number, title: string, covers: HTMLImageElement[], s: number) {
  if (!covers.length) return
  drawText(ctx, title, PADDING, y, { size: 22 * s, color: COLORS.muted, maxWidth: WIDTH - PADDING * 2 })

  const gap = 16
  const size = (WIDTH - PADDING * 2 - gap * (COVER_COLUMNS - 1)) / COVER_COLUMNS
  covers.slice(0, COVER_COLUMNS).forEach((img, i) => {
    const x = PADDING + i * (size + gap)
    const top = y + 36 * s

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

/** Personal year in review. Variants: 0 highlights, 1 finished covers, 2 top authors & genres */
export function renderUserYearReview(stats: UserYearStats, covers: CoverImages, variant: number, opts: YearInReviewRenderOptions): HTMLCanvasElement {
  const { t, locale, year } = opts
  const s = PORTRAIT_SCALE
  const height = PORTRAIT_HEIGHT
  const [canvas, ctx] = createCanvas(WIDTH, height, PORTRAIT_PIXEL_RATIO)
  const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n)
  const duration = (seconds: number) => formatDuration(seconds, t, { showDays: true })

  drawBackground(ctx, WIDTH, height, pickCovers(covers, [...stats.finishedBooksWithCovers, ...stats.booksWithCovers]), 200)
  drawHeader(ctx, opts, s)

  const colWidth = (WIDTH - PADDING * 2 - 16) / 2
  const col2 = PADDING + colWidth + 16
  const tileHeight = 120 * s
  const tileOptions = { valueSize: 44 * s, s }
  drawStatTile(
    ctx,
    PADDING,
    212 * s,
    colWidth,
    tileHeight,
    { icon: 'check_circle', value: formatNumber(stats.numBooksFinished), label: t('StatsBooksFinished') },
    tileOptions
  )
  drawStatTile(
    ctx,
    col2,
    212 * s,
    colWidth,
    tileHeight,
    { icon: 'schedule', value: duration(stats.totalListeningTime), label: t('StatsSpentListening') },
    { valueSize: 34 * s, s }
  )
  drawStatTile(
    ctx,
    PADDING,
    348 * s,
    colWidth,
    tileHeight,
    { icon: 'headphones', value: formatNumber(stats.totalListeningSessions), label: t('StatsSessions') },
    tileOptions
  )
  drawStatTile(
    ctx,
    col2,
    348 * s,
    colWidth,
    tileHeight,
    { icon: 'local_library', value: formatNumber(stats.numBooksListened), label: t('StatsBooksListenedTo') },
    tileOptions
  )

  if (variant === 0) {
    const narrator = stats.mostListenedNarrator
    const genre = stats.topGenres[0]
    const author = stats.topAuthors[0]
    const month = stats.mostListenedMonth
    if (narrator) drawHighlight(ctx, PADDING, 510 * s, colWidth, t('StatsTopNarrator'), narrator.name, duration(narrator.time), s)
    if (genre) drawHighlight(ctx, col2, 510 * s, colWidth, t('StatsTopGenre'), genre.genre, duration(genre.time), s)
    if (author) drawHighlight(ctx, PADDING, 642 * s, colWidth, t('StatsTopAuthor'), author.name, duration(author.time), s)
    if (month?.time) {
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month.month, 1))
      drawHighlight(
        ctx,
        col2,
        642 * s,
        colWidth,
        t('StatsTopMonth'),
        monthName.charAt(0).toLocaleUpperCase(locale) + monthName.slice(1),
        duration(month.time),
        s
      )
    }
  } else if (variant === 1) {
    drawCoverRow(ctx, 530 * s, t('StatsBooksFinishedThisYear'), pickCovers(covers, stats.finishedBooksWithCovers), s)
  } else {
    drawRankedList(ctx, PADDING, 524 * s, colWidth, t('StatsTopAuthors'), stats.topAuthors, opts, s)
    drawRankedList(ctx, col2, 524 * s, colWidth, t('StatsTopGenres'), toNameTime(stats.topGenres), opts, s)
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
  drawStatTile(
    ctx,
    padding,
    68,
    tileWidth,
    108,
    { icon: 'check_circle', value: formatNumber(stats.numBooksFinished), label: t('StatsBooksFinished') },
    { valueSize: 40 }
  )
  drawStatTile(
    ctx,
    padding + tileWidth + 16,
    68,
    tileWidth,
    108,
    { icon: 'local_library', value: formatNumber(stats.numBooksListened), label: t('StatsBooksListenedTo') },
    { valueSize: 40 }
  )

  return canvas
}

/** Server year in review. Variants: 0 added covers, 1 top authors & narrators, 2 top authors & genres */
export function renderServerYearReview(stats: ServerYearStats, covers: CoverImages, variant: number, opts: YearInReviewRenderOptions): HTMLCanvasElement {
  const { t, locale } = opts
  const s = PORTRAIT_SCALE
  const height = PORTRAIT_HEIGHT
  const [canvas, ctx] = createCanvas(WIDTH, height, PORTRAIT_PIXEL_RATIO)
  const formatNumber = (n: number) => new Intl.NumberFormat(locale).format(n)
  const duration = (seconds: number) => formatDuration(seconds, t, { showDays: true })
  const addedCovers = pickCovers(covers, stats.booksAddedWithCovers)

  drawBackground(ctx, WIDTH, height, addedCovers, 200)
  drawHeader(ctx, opts, s)

  const thirdWidth = (WIDTH - PADDING * 2 - 32) / 3
  const tiles: StatTile[] = [
    { icon: 'library_add', value: formatNumber(stats.numBooksAdded), label: t('StatsBooksAdded') },
    { icon: 'person_add', value: formatNumber(stats.numAuthorsAdded), label: t('StatsAuthorsAdded') },
    { icon: 'headphones', value: formatNumber(stats.numListeningSessions), label: t('StatsSessions') }
  ]
  tiles.forEach((tile, i) => drawStatTile(ctx, PADDING + i * (thirdWidth + 16), 212 * s, thirdWidth, 120 * s, tile, { valueSize: 40 * s, iconRadius: 17, s }))

  const colWidth = (WIDTH - PADDING * 2 - 16) / 2
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
    const maxWidth = colWidth - 48
    drawTile(ctx, tile.x, 348 * s, colWidth, 120 * s)
    drawText(ctx, tile.label, tile.x + 24, 378 * s, { size: 20 * s, weight: 600, color: COLORS.muted, maxWidth, fit: true })
    drawText(ctx, tile.value, tile.x + 24, 414 * s, { size: 32 * s, weight: 600, maxWidth, fit: true })
    drawText(ctx, `+${tile.delta}`, tile.x + 24, 446 * s, { size: 20 * s, weight: 600, color: COLORS.accent, maxWidth, fit: true })
  })

  if (variant === 0) {
    drawCoverRow(ctx, 530 * s, t('StatsBooksAdditional'), addedCovers, s)
  } else {
    drawRankedList(ctx, PADDING, 524 * s, colWidth, t('StatsTopAuthors'), stats.topAuthors, opts, s)
    if (variant === 1) drawRankedList(ctx, col2, 524 * s, colWidth, t('StatsTopNarrators'), stats.topNarrators, opts, s)
    else drawRankedList(ctx, col2, 524 * s, colWidth, t('StatsTopGenres'), toNameTime(stats.topGenres), opts, s)
  }

  return canvas
}
