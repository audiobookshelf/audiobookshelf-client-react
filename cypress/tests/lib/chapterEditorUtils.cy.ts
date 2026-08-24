import {
  buildBulkChapters,
  buildChapterDirtyBaseline,
  buildIdenticalChapters,
  detectBulkChapterPattern,
  getChapterDirtyFields,
  initChapters,
  insertChapterBelow,
  mergeAudibleChapterData,
  mergeAudibleChapterTitles,
  removeBrandingFromAudibleData
} from '@/lib/chapters/chapterEditorUtils'
import type { AudibleChapterSearchResult, Chapter } from '@/types/api'

function audibleChapter(title: string, startOffsetMs: number, lengthMs: number) {
  const startOffsetSec = Math.floor(startOffsetMs / 1000)
  return { title, startOffsetMs, startOffsetSec, lengthMs }
}

describe('removeBrandingFromAudibleData', () => {
  it('subtracts intro duration and normalizes starts to whole seconds', () => {
    const data: AudibleChapterSearchResult = {
      runtimeLengthMs: 200_000,
      runtimeLengthSec: 200,
      brandIntroDurationMs: 15_000,
      brandOutroDurationMs: 0,
      chapters: [audibleChapter('Chapter 1', 15_000, 85_000), audibleChapter('Chapter 2', 115_000, 85_000)]
    }

    const result = removeBrandingFromAudibleData(data)

    expect(result.chapters).to.have.length(2)
    expect(result.chapters[0].startOffsetSec).to.equal(0)
    expect(result.chapters[0].startOffsetMs).to.equal(0)
    expect(result.chapters[1].startOffsetSec).to.equal(100)
    expect(result.chapters[1].startOffsetMs).to.equal(100_000)
  })

  it('keeps the first chapter when its start falls within the intro', () => {
    const data: AudibleChapterSearchResult = {
      runtimeLengthMs: 200_000,
      runtimeLengthSec: 200,
      brandIntroDurationMs: 15_000,
      brandOutroDurationMs: 0,
      chapters: [audibleChapter('Chapter 1', 0, 100_000), audibleChapter('Chapter 2', 115_000, 85_000)]
    }

    const result = removeBrandingFromAudibleData(data)

    expect(result.chapters).to.have.length(2)
    expect(result.chapters[0].title).to.equal('Chapter 1')
    expect(result.chapters[0].startOffsetSec).to.equal(0)
    expect(result.chapters[1].startOffsetSec).to.equal(100)
  })
})

describe('chapter start dirty comparison', () => {
  it('treats starts within one second as unchanged', () => {
    const saved: Chapter[] = [{ id: 0, start: 100, end: 500, title: 'Chapter 1' }]
    const mediaDuration = 500
    const chapter = { id: 0, start: 101, end: 500, title: 'Chapter 1', clientKey: 'ch-0', error: null }
    const baseline = buildChapterDirtyBaseline([chapter], saved, mediaDuration)

    expect(getChapterDirtyFields(chapter, baseline).start).to.equal(false)
  })

  it('still marks a two-second start change as dirty', () => {
    const saved: Chapter[] = [{ id: 0, start: 100, end: 500, title: 'Chapter 1' }]
    const mediaDuration = 500
    const chapter = { id: 0, start: 102, end: 500, title: 'Chapter 1', clientKey: 'ch-0', error: null }
    const baseline = buildChapterDirtyBaseline([chapter], saved, mediaDuration)

    expect(getChapterDirtyFields(chapter, baseline).start).to.equal(true)
  })
})

describe('mergeAudibleChapterTitles', () => {
  it('keeps found chapters, existing starts on match, and drops unmatched existing', () => {
    const saved: Chapter[] = [
      { id: 0, start: 0, end: 100, title: 'Saved Intro' },
      { id: 1, start: 100, end: 200, title: 'Saved Only' },
      { id: 2, start: 200, end: 500, title: 'Saved Chapter' }
    ]
    const mediaDuration = 500
    const existing = initChapters(saved, mediaDuration)

    const audible: AudibleChapterSearchResult = {
      runtimeLengthMs: 500_000,
      runtimeLengthSec: 500,
      chapters: [audibleChapter('Opening Credits', 0, 20_000), audibleChapter('Found Insert', 20_000, 80_000), audibleChapter('Rule Two', 205_000, 295_000)]
    }

    const { chapters: merged } = mergeAudibleChapterTitles(existing, audible, mediaDuration)

    expect(merged).to.have.length(3)
    expect(merged[0].title).to.equal('Opening Credits')
    expect(merged[0].start).to.equal(0)
    expect(merged[0].clientKey).to.equal('ch-0')

    expect(merged[1].title).to.equal('Found Insert')
    expect(merged[1].start).to.equal(20)
    expect(merged[1].clientKey).to.match(/^ch-/)
    expect(merged[1].clientKey).to.not.equal('ch-1')

    expect(merged[2].title).to.equal('Rule Two')
    expect(merged[2].start).to.equal(200)
    expect(merged[2].clientKey).to.equal('ch-2')
  })
})

describe('mergeAudibleChapterData after remove branding', () => {
  it('preserves stable client keys and clean start highlighting when times align with saved', () => {
    const saved: Chapter[] = [
      { id: 0, start: 0, end: 100, title: 'Chapter 1' },
      { id: 1, start: 100, end: 500, title: 'Chapter 2' }
    ]
    const mediaDuration = 500
    const existing = initChapters(saved, mediaDuration)

    const audible: AudibleChapterSearchResult = {
      runtimeLengthMs: 515_000,
      runtimeLengthSec: 515,
      brandIntroDurationMs: 15_000,
      brandOutroDurationMs: 0,
      chapters: [audibleChapter('Chapter 1', 15_000, 85_000), audibleChapter('Chapter 2', 115_000, 385_000)]
    }

    const processed = removeBrandingFromAudibleData(audible)
    const { chapters: merged } = mergeAudibleChapterData(processed, mediaDuration, existing)
    const baseline = buildChapterDirtyBaseline(merged, saved, mediaDuration)

    expect(merged).to.have.length(2)
    expect(merged[0].clientKey).to.equal('ch-0')
    expect(merged[1].clientKey).to.equal('ch-1')
    expect(getChapterDirtyFields(merged[0], baseline).start).to.equal(false)
    expect(getChapterDirtyFields(merged[1], baseline).start).to.equal(false)
  })
})

describe('buildIdenticalChapters', () => {
  it('replaces the empty placeholder instead of appending', () => {
    const mediaDuration = 500
    const existing = initChapters([], mediaDuration)
    const result = buildIdenticalChapters('Chapter 1', 3, existing, mediaDuration)

    expect(existing).to.have.length(1)
    expect(existing[0].title).to.equal('')
    expect(result).to.have.length(3)
    expect(result.map((chapter) => chapter.title)).to.deep.equal(['Chapter 1', 'Chapter 1', 'Chapter 1'])
    expect(result[0].start).to.equal(0)
    expect(result[1].start).to.equal(1)
    expect(result[2].start).to.equal(2)
  })

  it('appends after existing real chapters', () => {
    const mediaDuration = 500
    const existing = initChapters(
      [
        { id: 0, start: 0, end: 100, title: 'Intro' },
        { id: 1, start: 100, end: 500, title: 'Chapter 1' }
      ],
      mediaDuration
    )
    const result = buildIdenticalChapters('Extra', 2, existing, mediaDuration)

    expect(result).to.have.length(4)
    expect(result[2].title).to.equal('Extra')
    expect(result[2].start).to.equal(101)
    expect(result[3].start).to.equal(102)
  })
})

describe('buildBulkChapters', () => {
  it('replaces the empty placeholder with numbered titles starting at 0:00', () => {
    const mediaDuration = 500
    const existing = initChapters([], mediaDuration)
    const pattern = detectBulkChapterPattern('Episode 1')
    expect(pattern).to.not.equal(null)

    const result = buildBulkChapters(pattern!, 2, existing, mediaDuration)

    expect(result).to.have.length(2)
    expect(result[0].title).to.equal('Episode 1')
    expect(result[0].start).to.equal(0)
    expect(result[1].title).to.equal('Episode 2')
    expect(result[1].start).to.equal(1)
  })
})

describe('insertChapterBelow', () => {
  it('inserts at the midpoint so the new start is strictly between neighbors', () => {
    const chapters = [
      { id: 0, start: 0, end: 100, title: 'A', error: null, clientKey: 'ch-0' },
      { id: 1, start: 100, end: 500, title: 'B', error: null, clientKey: 'ch-1' }
    ]
    const result = insertChapterBelow(chapters, chapters[0])

    expect(result).to.have.length(3)
    expect(result[1].title).to.equal('')
    expect(result[1].start).to.equal(50)
    expect(result[1].start).to.be.greaterThan(result[0].start)
    expect(result[1].start).to.be.lessThan(result[2].start)
  })

  it('inserts one second after the last chapter', () => {
    const chapters = [
      { id: 0, start: 0, end: 100, title: 'A', error: null, clientKey: 'ch-0' },
      { id: 1, start: 100, end: 500, title: 'B', error: null, clientKey: 'ch-1' }
    ]
    const result = insertChapterBelow(chapters, chapters[1])

    expect(result).to.have.length(3)
    expect(result[2].start).to.equal(101)
    expect(result[2].title).to.equal('')
  })
})
