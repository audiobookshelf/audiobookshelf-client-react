import { DomWrappingMarquee, wrappingMarqueeCycleDistance, wrappingMarqueeDurationMs, wrappingMarqueeHoldPercent } from '@/lib/player/domWrappingMarquee'

function appendMarqueeTrack(doc: Document, segmentText: string) {
  const container = doc.createElement('div')
  container.style.width = '80px'
  container.style.overflow = 'hidden'

  const track = doc.createElement('div')
  track.className = 'player-marquee-track'
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

  return { container, track, segment, gap, loopCopy }
}

describe('DomWrappingMarquee', () => {
  it('keeps the loop copy hidden when the text fits', () => {
    cy.document().then((doc) => {
      const { container, track, segment, gap, loopCopy } = appendMarqueeTrack(doc, 'Short')
      container.style.width = '400px'
      const marquee = new DomWrappingMarquee(container, track, segment, loopCopy)

      expect(loopCopy.style.display).to.equal('none')
      expect(gap.style.display).to.equal('none')

      marquee.init()
      expect(loopCopy.style.display).to.equal('none')
      expect(gap.style.display).to.equal('none')
      expect(container.classList.contains('player-marquee--overflow')).to.equal(false)

      marquee.reset()
      container.remove()
    })
  })

  it('shows the loop copy and sets CSS scroll vars when the text overflows', () => {
    cy.document().then((doc) => {
      const { container, track, segment, gap, loopCopy } = appendMarqueeTrack(doc, 'Alice, Bob, Carol, Dave, Eve')
      const marquee = new DomWrappingMarquee(container, track, segment, loopCopy)
      marquee.init()

      expect(track.children).to.have.length(3)
      expect(track.children[2]).to.equal(loopCopy)
      expect(loopCopy.style.display).to.equal('inline-block')
      expect(gap.style.display).to.equal('inline')
      expect(container.classList.contains('player-marquee--overflow')).to.equal(true)

      const distance = Number(container.style.getPropertyValue('--marquee-distance'))
      expect(distance).to.equal(wrappingMarqueeCycleDistance(segment.getBoundingClientRect().left, loopCopy.getBoundingClientRect().left))
      expect(distance).to.be.greaterThan(segment.offsetWidth)
      expect(distance).to.be.lessThan(segment.offsetWidth * 2)
      expect(container.style.getPropertyValue('--marquee-dur')).to.equal(`${wrappingMarqueeDurationMs(distance)}ms`)
      expect(container.style.getPropertyValue('--marquee-hold')).to.equal(`${wrappingMarqueeHoldPercent(distance)}%`)

      marquee.reset()
      expect(loopCopy.style.display).to.equal('none')
      expect(container.classList.contains('player-marquee--overflow')).to.equal(false)
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
      marquee.init()

      expect(track.querySelectorAll('a')).to.have.length(4)
      expect(loopCopy.contains(loopSecond)).to.equal(true)
      expect(loopCopy.style.pointerEvents).not.to.equal('none')
      expect(loopCopy.style.display).to.equal('inline-block')

      marquee.reset()
      expect(loopCopy.contains(loopSecond)).to.equal(true)
      expect(loopCopy.style.display).to.equal('none')
      container.remove()
    })
  })

  it('uses a 2s hold plus 30ms per pixel for the CSS duration', () => {
    expect(wrappingMarqueeCycleDistance(10, 230)).to.equal(220)
    expect(wrappingMarqueeDurationMs(220)).to.equal(2000 + 220 * 30)
    expect(wrappingMarqueeHoldPercent(220)).to.be.closeTo((2000 / (2000 + 220 * 30)) * 100, 0.001)
  })
})
