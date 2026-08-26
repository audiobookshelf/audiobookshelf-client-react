import { matchChaptersMonotonic, toChapterMatchInput } from '@/lib/chapters/chapterMatching'

function chapters(specs: { start: number; title: string }[]) {
  return specs.map(toChapterMatchInput)
}

describe('matchChaptersMonotonic', () => {
  it('matches equal count with a global start shift', () => {
    const existing = chapters([
      { start: 0, title: 'Intro' },
      { start: 100, title: 'Chapter 1' },
      { start: 500, title: 'Chapter 2' }
    ])
    const incoming = chapters([
      { start: 5, title: 'Intro' },
      { start: 105, title: 'Chapter 1' },
      { start: 505, title: 'Chapter 2' }
    ])

    const { matches } = matchChaptersMonotonic(existing, incoming)
    expect(matches.size).to.equal(3)
    expect(matches.get(0)).to.equal(0)
    expect(matches.get(1)).to.equal(1)
    expect(matches.get(2)).to.equal(2)
  })

  it('leaves an inserted incoming chapter unmatched', () => {
    const existing = chapters([
      { start: 0, title: 'A' },
      { start: 100, title: 'B' }
    ])
    const incoming = chapters([
      { start: 0, title: 'A' },
      { start: 50, title: 'Inserted' },
      { start: 100, title: 'B' }
    ])

    const { matches } = matchChaptersMonotonic(existing, incoming)
    expect(matches.get(0)).to.equal(0)
    expect(matches.has(1)).to.equal(false)
    expect(matches.get(2)).to.equal(1)
  })

  it('matches renamed titles when starts align', () => {
    const existing = chapters([
      { start: 0, title: 'Old Name' },
      { start: 200, title: 'Part Two' }
    ])
    const incoming = chapters([
      { start: 0, title: 'New Name' },
      { start: 200, title: 'Part 2' }
    ])

    const { matches } = matchChaptersMonotonic(existing, incoming)
    expect(matches.size).to.equal(2)
    expect(matches.get(0)).to.equal(0)
    expect(matches.get(1)).to.equal(1)
  })

  it('matches when several existing chapters fall in the start window', () => {
    const existing = chapters([
      { start: 5483, title: 'Lead-in A' },
      { start: 5490, title: 'Lead-in B' },
      { start: 5495, title: 'Lead-in C' },
      { start: 5498, title: 'Chapter 42' },
      { start: 5600, title: 'Chapter 43' }
    ])
    const incoming = chapters([{ start: 5543, title: 'Chapter 42' }])

    const { matches } = matchChaptersMonotonic(existing, incoming)
    expect(matches.get(0)).to.equal(3)
  })

  it('matches Audible rule titles to generic saved filenames by start time', () => {
    const existing = chapters([
      { start: 0, title: '12 Rules for Life An Antidote to Chaos (Unabridged) - 01' },
      { start: 1434, title: '12 Rules for Life An Antidote to Chaos (Unabridged) - 02' },
      { start: 5498, title: '12 Rules for Life An Antidote to Chaos (Unabridged) - 03' },
      { start: 10622, title: '12 Rules for Life An Antidote to Chaos (Unabridged) - 04' }
    ])
    const incoming = chapters([
      { start: 0, title: 'Opening Credits' },
      { start: 20, title: 'Overture' },
      { start: 1439, title: 'Rule One: Stand up straight with your shoulders back' },
      { start: 5543, title: 'Rule Two: Treat yourself like someone you are responsible for helping' },
      { start: 10666, title: 'Rule Three: Make friends with people who want the best for you' }
    ])

    const { matches } = matchChaptersMonotonic(existing, incoming)
    expect(matches.get(0)).to.equal(0)
    expect(matches.has(1)).to.equal(false)
    expect(matches.get(2)).to.equal(1)
    expect(matches.get(3)).to.equal(2)
    expect(matches.get(4)).to.equal(3)
  })
})
