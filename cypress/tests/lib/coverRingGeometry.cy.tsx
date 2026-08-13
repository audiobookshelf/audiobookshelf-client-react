import {
  buildRingSamples,
  createRingGeometry,
  getRingPercentAtPoint,
  getRingPerimeter,
  getRingPointAtLength,
  getRingStartOffsetPercent,
  RING_PAD,
  RING_STROKE
} from '@/lib/player/coverRingGeometry'

const COVER_WIDTH = 420
const COVER_HEIGHT = 672 // 420 * 1.6, the default book cover aspect ratio
const COVER_RADIUS = 16

describe('coverRingGeometry', () => {
  const geometry = createRingGeometry(COVER_WIDTH, COVER_HEIGHT, COVER_RADIUS)
  const samples = buildRingSamples(geometry)
  const perimeter = getRingPerimeter(geometry)
  const startOffsetPercent = getRingStartOffsetPercent(geometry)

  /** Point on the ring at a given playback progress, measured from bottom center */
  function pointAtProgress(percent: number) {
    return getRingPointAtLength(geometry, (((startOffsetPercent + percent) % 100) / 100) * perimeter)
  }

  it('pads the artwork on every side', () => {
    expect(geometry.viewWidth).to.equal(COVER_WIDTH + RING_PAD * 2)
    expect(geometry.viewHeight).to.equal(COVER_HEIGHT + RING_PAD * 2)
  })

  it('keeps the stroke centerline concentric with the artwork corners', () => {
    expect(geometry.radius).to.equal(COVER_RADIUS + RING_PAD - RING_STROKE / 2)
  })

  it('measures the perimeter of the rounded rect', () => {
    const width = geometry.viewWidth - geometry.stroke
    const height = geometry.viewHeight - geometry.stroke
    const radius = geometry.radius
    const expected = 2 * (width - 2 * radius) + 2 * (height - 2 * radius) + 2 * Math.PI * radius

    expect(perimeter).to.be.closeTo(expected, 0.0001)
  })

  it('starts the path on the top edge, just past the corner arc', () => {
    const start = getRingPointAtLength(geometry, 0)

    expect(start.x).to.be.closeTo(geometry.stroke / 2 + geometry.radius, 0.0001)
    expect(start.y).to.be.closeTo(geometry.stroke / 2, 0.0001)
  })

  it('starts progress at bottom center', () => {
    const origin = pointAtProgress(0)

    expect(origin.x).to.be.closeTo(geometry.viewWidth / 2, 0.0001)
    expect(origin.y).to.be.closeTo(geometry.viewHeight - geometry.stroke / 2, 0.0001)
  })

  it('reaches bottom center again after a full lap', () => {
    const full = getRingPointAtLength(geometry, perimeter)
    const start = getRingPointAtLength(geometry, 0)

    expect(full.x).to.be.closeTo(start.x, 0.0001)
    expect(full.y).to.be.closeTo(start.y, 0.0001)
  })

  it('maps a point on the ring back to the progress that produced it', () => {
    // Sampling resolution is 100/240 of the perimeter, so allow half a step
    const tolerance = 0.25

    for (const percent of [5, 12.5, 25, 40, 50, 66.6, 75, 90, 99]) {
      const percentFromPoint = getRingPercentAtPoint(geometry, samples, pointAtProgress(percent))

      expect(percentFromPoint, `progress ${percent}%`).to.not.equal(null)
      expect(percentFromPoint as number, `progress ${percent}%`).to.be.closeTo(percent, tolerance)
    }
  })

  it('returns null when there is nothing to match against', () => {
    expect(getRingPercentAtPoint(geometry, [], { x: 0, y: 0 })).to.equal(null)
  })

  it('handles artwork small enough that the corner radii meet', () => {
    const tiny = createRingGeometry(20, 20, COVER_RADIUS)
    const tinyPerimeter = getRingPerimeter(tiny)

    expect(tinyPerimeter).to.be.greaterThan(0)
    expect(getRingPointAtLength(tiny, tinyPerimeter / 2).x).to.be.a('number')
  })
})
