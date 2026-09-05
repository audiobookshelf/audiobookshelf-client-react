import { WrappingMarquee } from '@/lib/player/wrappingMarquee'

describe('WrappingMarquee', () => {
  it('does not scroll when the text fits', () => {
    cy.document().then((doc) => {
      const container = doc.createElement('div')
      container.style.width = '200px'
      container.style.overflow = 'hidden'
      const textEl = doc.createElement('p')
      textEl.className = 'whitespace-nowrap'
      container.appendChild(textEl)
      doc.body.appendChild(container)

      const marquee = new WrappingMarquee(container)
      marquee.init('Short')

      expect(textEl.textContent).to.equal('Short')
      expect(textEl.style.transform).to.equal('translateX(0px)')
      expect(container.style.maskImage).to.equal('')

      marquee.reset()
      container.remove()
    })
  })

  it('starts a scroll timer when the text overflows', () => {
    cy.document().then((doc) => {
      const container = doc.createElement('div')
      container.style.width = '80px'
      container.style.overflow = 'hidden'
      const textEl = doc.createElement('p')
      textEl.className = 'whitespace-nowrap'
      container.appendChild(textEl)
      doc.body.appendChild(container)

      const marquee = new WrappingMarquee(container)
      marquee.init('A very long audiobook title that will not fit')

      expect(textEl.textContent).to.equal('A very long audiobook title that will not fit')

      marquee.reset()
      container.remove()
    })
  })
})
