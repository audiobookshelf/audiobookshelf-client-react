import { DomWrappingMarquee, wrappingMarqueeCycleDistance } from '@/lib/player/domWrappingMarquee'

describe('DomWrappingMarquee', () => {
  it('stops after one cycle, when the clone lines up with the original start', () => {
    expect(wrappingMarqueeCycleDistance(10, 230)).to.equal(220)
    expect(wrappingMarqueeCycleDistance(10, 230)).to.be.lessThan(180 + 40 + 180)

    cy.document().then((doc) => {
      const container = doc.createElement('div')
      container.style.width = '80px'
      container.style.overflow = 'hidden'

      const track = doc.createElement('div')
      track.style.width = 'max-content'
      track.style.whiteSpace = 'nowrap'

      const segment = doc.createElement('span')
      segment.style.display = 'inline-block'
      segment.style.whiteSpace = 'nowrap'
      segment.textContent = 'Alice, Bob, Carol, Dave, Eve'

      track.append(segment)
      container.append(track)
      doc.body.append(container)

      const marquee = new DomWrappingMarquee(container, track, segment)
      marquee.startScroll()

      expect(track.children).to.have.length(3)
      const clone = track.children[2]
      expect(clone).to.be.instanceOf(HTMLElement)
      if (clone instanceof HTMLElement) {
        const cycle = wrappingMarqueeCycleDistance(segment.getBoundingClientRect().left, clone.getBoundingClientRect().left)
        expect(cycle).to.be.greaterThan(segment.offsetWidth)
        expect(cycle).to.be.lessThan(segment.offsetWidth * 2)
      }

      marquee.reset()
      container.remove()
    })
  })
})
