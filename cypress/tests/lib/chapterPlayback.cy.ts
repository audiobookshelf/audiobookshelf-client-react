import { findChapterAtTime, findChapterNavigationAtTime, resolveNextTarget, resolvePreviousTarget } from '@/lib/chapters/chapterPlayback'
import type { Chapter } from '@/types/api'

const chapters: Chapter[] = [
  { id: 1, start: 0, end: 9942.909, title: 'Brienne I' },
  { id: 2, start: 9942.909, end: 12584.156, title: 'Samwell I' },
  { id: 3, start: 12584.156, end: 15615.96, title: 'Arya I' }
]

describe('findChapterAtTime', () => {
  it('returns the chapter containing the time', () => {
    expect(findChapterAtTime(chapters, 5000)?.title).to.equal('Brienne I')
    expect(findChapterAtTime(chapters, 10000)?.title).to.equal('Samwell I')
  })

  it('resolves an exact chapter start to that chapter', () => {
    expect(findChapterAtTime(chapters, 9942.909)?.title).to.equal('Samwell I')
  })

  it('resolves a start whose stored bound was rounded up', () => {
    // Chapter bounds are stored rounded to 6dp; the item page seeks with the unrounded value
    const rounded: Chapter[] = [
      { id: 1, start: 0, end: 12584.156112, title: 'Brienne I' },
      { id: 2, start: 12584.156112, end: 15615.96, title: 'Samwell I' }
    ]
    expect(findChapterAtTime(rounded, 12584.156111999999)?.title).to.equal('Samwell I')
  })

  it('stays in the last chapter through its final moments', () => {
    expect(findChapterAtTime(chapters, 12584.155)?.title).to.equal('Samwell I')
  })

  it('rounds the query time the same way the bounds are stored', () => {
    const rounded: Chapter[] = [
      { id: 1, start: 0, end: 100.000001, title: 'A' },
      { id: 2, start: 100.000001, end: 200, title: 'B' }
    ]
    // Just below B's start, but rounds up onto it
    expect(findChapterAtTime(rounded, 100.0000009)?.title).to.equal('B')
  })

  it('returns null when no chapter covers the time', () => {
    expect(findChapterAtTime(chapters, 99999)).to.equal(null)
    expect(findChapterAtTime(chapters, -1)).to.equal(null)
    expect(findChapterAtTime([], 10)).to.equal(null)
  })
})

describe('findChapterNavigationAtTime', () => {
  it('returns adjacent chapters at a rounded chapter boundary', () => {
    expect(findChapterNavigationAtTime(chapters, 9942.908999999999)).to.deep.equal({
      current: chapters[1],
      next: chapters[2],
      previous: chapters[0]
    })
  })

  it('returns the chapters surrounding a gap', () => {
    const chaptersWithGap = [
      { id: 0, title: 'One', start: 0, end: 10 },
      { id: 1, title: 'Two', start: 20, end: 30 }
    ]

    expect(findChapterNavigationAtTime(chaptersWithGap, 15)).to.deep.equal({
      current: null,
      next: chaptersWithGap[1],
      previous: chaptersWithGap[0]
    })
  })
})

describe('resolvePreviousTarget', () => {
  const threeChapters: Chapter[] = [
    { id: 0, title: 'One', start: 0, end: 100 },
    { id: 1, title: 'Two', start: 100, end: 200 },
    { id: 2, title: 'Three', start: 200, end: 300 }
  ]

  it('restarts the current chapter once past its first seconds', () => {
    expect(resolvePreviousTarget(threeChapters, 104)).to.equal(100)
  })

  it('goes back a chapter within the first seconds', () => {
    expect(resolvePreviousTarget(threeChapters, 102)).to.equal(0)
    expect(resolvePreviousTarget(threeChapters, 103)).to.equal(0)
  })

  it('goes to the start of the book from the first chapter', () => {
    expect(resolvePreviousTarget(threeChapters, 2)).to.equal(0)
    expect(resolvePreviousTarget(threeChapters, 50)).to.equal(0)
  })

  it('defers to the queue only within the first seconds of a book with no chapters', () => {
    expect(resolvePreviousTarget([], 2)).to.equal(null)
    expect(resolvePreviousTarget([], 50)).to.equal(0)
  })
})

describe('resolveNextTarget', () => {
  const twoChapters: Chapter[] = [
    { id: 0, title: 'One', start: 0, end: 100 },
    { id: 1, title: 'Two', start: 100, end: 200 }
  ]

  it('returns the next chapter start', () => {
    expect(resolveNextTarget(twoChapters, 50)).to.equal(100)
  })

  it('defers to the queue in the last chapter', () => {
    expect(resolveNextTarget(twoChapters, 150)).to.equal(null)
    expect(resolveNextTarget([], 10)).to.equal(null)
  })
})
