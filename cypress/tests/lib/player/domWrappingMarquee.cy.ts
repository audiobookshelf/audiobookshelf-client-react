import { DomWrappingMarquee, wrappingMarqueeCycleDistance } from '@/lib/player/domWrappingMarquee'

function appendMarqueeTrack(doc: Document, segmentText: string) {
  const container = doc.createElement('div')
  container.style.width = '80px'
  container.style.overflow = 'hidden'

  const track = doc.createElement('div')
  track.style.width = 'max-content'
  track.style.whiteSpace = 'nowrap'

  const segment = doc.createElement('span')
  segment.style.display = 'inline-block'
  segment.style.whiteSpace = 'nowrap'
  segment.textContent = segmentText

  const gap = doc.createElement('span')
  gap.setAttribute('aria-hidden', 'true')
  gap.style.pointerEvents = 'none'
  gap.innerHTML = '&nbsp;'.repeat(15)

  const loopCopy = doc.createElement('span')
  loopCopy.style.display = 'inline-block'
  loopCopy.style.whiteSpace = 'nowrap'
  loopCopy.setAttribute('aria-hidden', 'true')
  loopCopy.textContent = segmentText

  track.append(segment, gap, loopCopy)
  container.append(track)
  doc.body.append(container)

  return { container, track, segment, loopCopy }
}

describe('DomWrappingMarquee', () => {
  it('stops after one cycle, when the copy lines up with the original start', () => {
    expect(wrappingMarqueeCycleDistance(10, 230)).to.equal(220)
    expect(wrappingMarqueeCycleDistance(10, 230)).to.be.lessThan(180 + 40 + 180)

    cy.document().then((doc) => {
      const { container, track, segment, loopCopy } = appendMarqueeTrack(doc, 'Alice, Bob, Carol, Dave, Eve')
      const marquee = new DomWrappingMarquee(container, track, segment, loopCopy)
      marquee.startScroll()

      expect(track.children).to.have.length(3)
      expect(track.children[2]).to.equal(loopCopy)
      const cycle = wrappingMarqueeCycleDistance(segment.getBoundingClientRect().left, loopCopy.getBoundingClientRect().left)
      expect(cycle).to.be.greaterThan(segment.offsetWidth)
      expect(cycle).to.be.lessThan(segment.offsetWidth * 2)

      marquee.reset()
      expect(track.children[2]).to.equal(loopCopy)
      container.remove()
    })
  })

  it('leaves loop-copy author links in the React tree instead of cloning them', () => {
    cy.document().then((doc) => {
      const { container, track, segment, loopCopy } = appendMarqueeTrack(doc, '')
      const first = doc.createElement('a')
      first.href = '/library/1/authors/a'
      first.textContent = 'Alice'
      const second = doc.createElement('a')
      second.href = '/library/1/authors/b'
      second.textContent = 'Bob'
      segment.append(first, doc.createTextNode(', '), second)

      const loopFirst = doc.createElement('a')
      loopFirst.href = '/library/1/authors/a'
      loopFirst.textContent = 'Alice'
      const loopSecond = doc.createElement('a')
      loopSecond.href = '/library/1/authors/b'
      loopSecond.textContent = 'Bob'
      loopCopy.append(loopFirst, doc.createTextNode(', '), loopSecond)

      const marquee = new DomWrappingMarquee(container, track, segment, loopCopy)
      marquee.startScroll()

      expect(track.querySelectorAll('a')).to.have.length(4)
      expect(loopCopy.contains(loopSecond)).to.equal(true)
      expect(loopCopy.style.pointerEvents).not.to.equal('none')

      marquee.reset()
      container.remove()
    })
  })
})
