import { formatChapterSegmentLabel, getChapterMarkers, getChapterSegments, isActiveChapterSegment } from '@/lib/player/getChapterMarkers'
import type { Chapter } from '@/types/api'

function chapter(partial: Partial<Chapter> & Pick<Chapter, 'id' | 'start'>): Chapter {
  return {
    end: (partial.start ?? 0) + 60,
    title: `Chapter ${partial.id}`,
    ...partial
  }
}

describe('getChapterMarkers', () => {
  const duration = 600

  it('returns no markers when there are no chapters', () => {
    expect(getChapterMarkers([], duration)).to.deep.equal([])
    expect(getChapterMarkers(undefined, duration)).to.deep.equal([])
    expect(getChapterMarkers(null, duration)).to.deep.equal([])
  })

  it('skips a chapter that starts at 00:00', () => {
    const markers = getChapterMarkers([chapter({ id: 0, start: 0, title: 'Opening' }), chapter({ id: 1, start: 120, title: 'Later' })], duration)
    expect(markers).to.have.length(1)
    expect(markers[0]).to.include({ id: 1, start: 120, title: 'Later' })
    expect(markers[0].ratio).to.equal(120 / 600)
  })

  it('positions valid chapters at start / totalDuration', () => {
    const markers = getChapterMarkers([chapter({ id: 1, start: 60 }), chapter({ id: 2, start: 300 }), chapter({ id: 3, start: 450 })], duration)
    expect(markers.map((marker) => marker.ratio)).to.deep.equal([60 / 600, 300 / 600, 450 / 600])
  })

  it('ignores non-finite, negative, and out-of-range timestamps', () => {
    const markers = getChapterMarkers(
      [
        chapter({ id: 1, start: Number.NaN }),
        chapter({ id: 2, start: Number.POSITIVE_INFINITY }),
        chapter({ id: 3, start: -12 }),
        chapter({ id: 4, start: 600 }),
        chapter({ id: 5, start: 601 }),
        chapter({ id: 6, start: 90, title: 'Keep' })
      ],
      duration
    )
    expect(markers).to.have.length(1)
    expect(markers[0]).to.include({ id: 6, start: 90, title: 'Keep', ratio: 90 / 600 })
  })

  it('returns no markers for invalid duration', () => {
    const chapters = [chapter({ id: 1, start: 30 })]
    expect(getChapterMarkers(chapters, 0)).to.deep.equal([])
    expect(getChapterMarkers(chapters, -1)).to.deep.equal([])
    expect(getChapterMarkers(chapters, Number.NaN)).to.deep.equal([])
  })

  it('preserves close timestamps without shifting them', () => {
    const markers = getChapterMarkers([chapter({ id: 1, start: 100 }), chapter({ id: 2, start: 100.5 })], duration)
    expect(markers[0].ratio).to.equal(100 / 600)
    expect(markers[1].ratio).to.equal(100.5 / 600)
  })
})

describe('getChapterSegments', () => {
  const duration = 600

  it('returns no segments when there are no chapters', () => {
    expect(getChapterSegments([], duration)).to.deep.equal([])
    expect(getChapterSegments(undefined, duration)).to.deep.equal([])
  })

  it('keeps a first chapter that starts at 00:00 as a selectable segment without a boundary dot', () => {
    const segments = getChapterSegments([chapter({ id: 0, start: 0, title: 'Opening' }), chapter({ id: 1, start: 120, title: 'Later' })], duration)
    expect(segments).to.have.length(2)
    expect(segments[0]).to.include({
      number: 1,
      start: 0,
      end: 120,
      startRatio: 0,
      widthRatio: 120 / 600,
      showBoundary: false,
      title: 'Opening'
    })
    expect(segments[1]).to.include({
      number: 2,
      start: 120,
      end: 600,
      startRatio: 120 / 600,
      widthRatio: 480 / 600,
      showBoundary: true
    })
  })

  it('uses chronological numbering and widths from start to next start', () => {
    const segments = getChapterSegments(
      [chapter({ id: 9, start: 300, title: 'Middle' }), chapter({ id: 2, start: 0, title: 'Opening' }), chapter({ id: 4, start: 60, title: 'Next' })],
      duration
    )
    expect(segments.map((segment) => segment.number)).to.deep.equal([1, 2, 3])
    expect(segments.map((segment) => segment.start)).to.deep.equal([0, 60, 300])
    expect(segments.map((segment) => segment.end)).to.deep.equal([60, 300, 600])
    expect(segments.map((segment) => segment.widthRatio)).to.deep.equal([60 / 600, 240 / 600, 300 / 600])
  })

  it('excludes invalid timestamps from numbering', () => {
    const segments = getChapterSegments(
      [
        chapter({ id: 1, start: -1, title: 'Bad' }),
        chapter({ id: 2, start: 0, title: 'Opening' }),
        chapter({ id: 3, start: Number.NaN, title: 'NaN' }),
        chapter({ id: 4, start: 150, title: 'Keep' }),
        chapter({ id: 5, start: 600, title: 'At end' })
      ],
      duration
    )
    expect(segments).to.have.length(2)
    expect(segments[0]).to.include({ number: 1, title: 'Opening', start: 0 })
    expect(segments[1]).to.include({ number: 2, title: 'Keep', start: 150, end: 600 })
  })
})

describe('formatChapterSegmentLabel', () => {
  it('formats Chapter {number} - {title}', () => {
    expect(formatChapterSegmentLabel(1, 'Opening')).to.equal('Chapter 1 - Opening')
    expect(formatChapterSegmentLabel(2, 'Later')).to.equal('Chapter 2 - Later')
  })

  it('omits the dash and title when the title is empty', () => {
    expect(formatChapterSegmentLabel(1, '')).to.equal('Chapter 1')
    expect(formatChapterSegmentLabel(3, '   ')).to.equal('Chapter 3')
  })
})

describe('isActiveChapterSegment', () => {
  const segments = getChapterSegments([chapter({ id: 0, start: 0, title: 'Opening' }), chapter({ id: 1, start: 120, title: 'Later' })], 600)

  it('marks the chapter that contains the current time', () => {
    expect(isActiveChapterSegment(segments[0], 30, false)).to.equal(true)
    expect(isActiveChapterSegment(segments[1], 30, true)).to.equal(false)
    expect(isActiveChapterSegment(segments[0], 120, false)).to.equal(false)
    expect(isActiveChapterSegment(segments[1], 120, true)).to.equal(true)
  })
})
