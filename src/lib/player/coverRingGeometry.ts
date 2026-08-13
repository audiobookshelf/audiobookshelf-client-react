/**
 * Geometry for the rounded-rect progress ring drawn around the fullscreen player artwork.
 *
 * The ring is an SVG `<rect>` with `pathLength="100"`, so progress is expressed as a
 * percentage of the perimeter. Everything here works on the stroke centerline, which is
 * inset by half the stroke width from the viewBox.
 */

export interface RingGeometry {
  /** SVG viewBox width */
  viewWidth: number
  /** SVG viewBox height */
  viewHeight: number
  /** Ring stroke width */
  stroke: number
  /** Corner radius of the stroke centerline */
  radius: number
}

export interface RingPoint {
  x: number
  y: number
}

export interface RingSample extends RingPoint {
  /** Distance along the perimeter as a percentage, measured from the rect path start */
  lengthPercent: number
}

/** Ring stroke width in px */
export const RING_STROKE = 6
/** Gap between artwork edge and ring. Equal to the stroke so the ring's inner edge sits flush. */
export const RING_PAD = 6
/** Perimeter samples used to map a pointer position back to a percentage */
const RING_SAMPLE_COUNT = 240

/**
 * Build the ring around artwork of the given size.
 * `coverRadius` must match the artwork's corner radius so the two stay concentric.
 */
export function createRingGeometry(coverWidth: number, coverHeight: number, coverRadius: number): RingGeometry {
  return {
    viewWidth: coverWidth + RING_PAD * 2,
    viewHeight: coverHeight + RING_PAD * 2,
    stroke: RING_STROKE,
    // The stroke centerline sits (RING_PAD - stroke / 2) outside the artwork edge
    radius: coverRadius + RING_PAD - RING_STROKE / 2
  }
}

interface Centerline {
  width: number
  height: number
  radius: number
  originX: number
  originY: number
}

function getCenterline(geometry: RingGeometry): Centerline {
  const width = geometry.viewWidth - geometry.stroke
  const height = geometry.viewHeight - geometry.stroke
  return {
    width,
    height,
    radius: Math.min(geometry.radius, width / 2, height / 2),
    originX: geometry.stroke / 2,
    originY: geometry.stroke / 2
  }
}

export function getRingPerimeter(geometry: RingGeometry): number {
  const { width, height, radius } = getCenterline(geometry)
  return 2 * (width - 2 * radius) + 2 * (height - 2 * radius) + 2 * Math.PI * radius
}

/**
 * Walk the rounded rect clockwise from its native SVG path start (top edge, just after the
 * top-left corner arc) and return the point at arc length `length`.
 */
export function getRingPointAtLength(geometry: RingGeometry, length: number): RingPoint {
  const { width, height, radius, originX, originY } = getCenterline(geometry)
  const cornerArc = (Math.PI / 2) * radius
  const straightX = width - 2 * radius
  const straightY = height - 2 * radius

  let remaining = length

  if (remaining <= straightX) {
    return { x: originX + radius + remaining, y: originY }
  }
  remaining -= straightX

  if (remaining <= cornerArc) {
    const theta = -Math.PI / 2 + remaining / radius
    return { x: originX + width - radius + radius * Math.cos(theta), y: originY + radius + radius * Math.sin(theta) }
  }
  remaining -= cornerArc

  if (remaining <= straightY) {
    return { x: originX + width, y: originY + radius + remaining }
  }
  remaining -= straightY

  if (remaining <= cornerArc) {
    const theta = remaining / radius
    return { x: originX + width - radius + radius * Math.cos(theta), y: originY + height - radius + radius * Math.sin(theta) }
  }
  remaining -= cornerArc

  if (remaining <= straightX) {
    return { x: originX + width - radius - remaining, y: originY + height }
  }
  remaining -= straightX

  if (remaining <= cornerArc) {
    const theta = Math.PI / 2 + remaining / radius
    return { x: originX + radius + radius * Math.cos(theta), y: originY + height - radius + radius * Math.sin(theta) }
  }
  remaining -= cornerArc

  if (remaining <= straightY) {
    return { x: originX, y: originY + height - radius - remaining }
  }
  remaining -= straightY

  const theta = Math.PI + remaining / radius
  return { x: originX + radius + radius * Math.cos(theta), y: originY + radius + radius * Math.sin(theta) }
}

/**
 * Distance from the rect path start clockwise to bottom center, as a percentage of the
 * perimeter. Progress starts and ends at the bottom of the artwork rather than the top.
 */
export function getRingStartOffsetPercent(geometry: RingGeometry): number {
  const { width, height, radius } = getCenterline(geometry)
  const cornerArc = (Math.PI / 2) * radius
  const toBottomCenter = width - 2 * radius + cornerArc + (height - 2 * radius) + cornerArc + (width / 2 - radius)
  return (100 * toBottomCenter) / getRingPerimeter(geometry)
}

/** Sample the perimeter so a pointer position can be mapped back to a percentage. */
export function buildRingSamples(geometry: RingGeometry): RingSample[] {
  const perimeter = getRingPerimeter(geometry)
  const samples: RingSample[] = []

  for (let index = 0; index < RING_SAMPLE_COUNT; index++) {
    const length = (index / RING_SAMPLE_COUNT) * perimeter
    const point = getRingPointAtLength(geometry, length)
    samples.push({ x: point.x, y: point.y, lengthPercent: (100 * length) / perimeter })
  }

  return samples
}

/**
 * Nearest point on the ring to `point`, as a progress percentage (0-100) measured from
 * bottom center. Returns null when there are no samples to match against.
 */
export function getRingPercentAtPoint(geometry: RingGeometry, samples: RingSample[], point: RingPoint): number | null {
  if (!samples.length) return null

  let nearest = samples[0]
  let nearestDistance = Infinity

  for (const sample of samples) {
    const distance = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = sample
    }
  }

  return (nearest.lengthPercent - getRingStartOffsetPercent(geometry) + 100) % 100
}
