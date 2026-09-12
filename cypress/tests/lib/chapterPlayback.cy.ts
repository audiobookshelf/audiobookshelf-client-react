import { findChapterNavigationAtTime, resolveNextTarget, resolvePreviousTarget } from '@/lib/chapters/chapterPlayback'
import type { Chapter } from '@/types/api'

const chapters: Chapter[] = [
  { id: 1, start: 0, end: 9942.909, title: 'Brienne I' },
  { id: 2, start: 9942.909, end: 12584.156, title: 'Samwell I' },
  { id: 3, start: 12584.156, end: 15615.96, title: 'Arya I' }
]

describe('findChapterNavigationAtTime', () => {
  it('returns adjacent chapters at an exact chapter boundary', () => {
    expect(findChapterNavigationAtTime(chapters, 9942.909)).to.deep.equal({
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

  it('advances through successive seek destinations', () => {
    const fourChapters: Chapter[] = [
      { id: 0, title: 'One', start: 0, end: 100 },
      { id: 1, title: 'Two', start: 100, end: 200 },
      { id: 2, title: 'Three', start: 200, end: 300 },
      { id: 3, title: 'Four', start: 300, end: 400 }
    ]

    let time = 50
    const targets: (number | null)[] = []
    for (let press = 0; press < 3; press++) {
      const target = resolveNextTarget(fourChapters, time)
      targets.push(target)
      if (target !== null) time = target
    }

    expect(targets).to.deep.equal([100, 200, 300])
  })

  it('defers to the queue in the last chapter', () => {
    expect(resolveNextTarget(twoChapters, 150)).to.equal(null)
    expect(resolveNextTarget([], 10)).to.equal(null)
  })
})
