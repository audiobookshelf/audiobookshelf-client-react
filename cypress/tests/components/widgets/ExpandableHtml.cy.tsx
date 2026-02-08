import ExpandableHtml from '@/components/widgets/ExpandableHtml'

describe('<ExpandableHtml />', () => {
  const shortText = '<p>Short text that should not clamp.</p>'
  const longText = `
    <p>
      This is a very long text that represents a detailed description or content.
      It is intended to be long enough to trigger the overflow logic within the ExpandableHtml component.
      We need to ensure that it has enough characters and lines so that when we limit the lines
      (e.g., to 2 or 3), the browser will indeed clip it, and our component's logic will detect that overflow.
      Repeating the content to be sure:
      This is a very long text that represents a detailed description or content.
      It is intended to be long enough to trigger the overflow logic within the ExpandableText component.
      We need to ensure that it has enough characters and lines so that when we limit the lines
      (e.g., to 2 or 3), the browser will indeed clip it, and our component's logic will detect that overflow.
    </p>
  `

  it('renders with basic html content', () => {
    cy.mount(<ExpandableHtml html={shortText} />)
    cy.get('.default-style').should('contain.text', 'Short text that should not clamp')
  })

  it('does not show read more button for short text', () => {
    cy.mount(<ExpandableHtml html={shortText} lineClamp={3} />)
    // We expect the button not to exist because it shouldn't overflow
    cy.contains('Read more').should('not.exist')
  })

  it('shows read more button for long text (clamped)', () => {
    // Constraint the width to ensure wrapping and overflow
    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={longText} lineClamp={2} />
      </div>
    )

    // Give time for layout effect to measure
    cy.wait(50)

    cy.contains('Read more').should('be.visible')
    // Check styles for clamping
    cy.get('.default-style').should('have.css', '-webkit-line-clamp', '2')
  })

  it('expands when clicking read more', () => {
    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={longText} lineClamp={2} />
      </div>
    )

    cy.contains('Read more').click()

    cy.contains('Read less').should('be.visible')
    // Check styles for expansion
    cy.get('.default-style').should('not.have.css', '-webkit-line-clamp', '2')
    // In some browsers 'unset' might compute to 'none' or a specific value,
    // but the component sets it to 'unset'. We can verify the style attribute directly or check overflow.
    cy.get('.default-style').should('have.attr', 'style').and('include', 'line-clamp: unset')
  })

  it('collapses when clicking read less', () => {
    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={longText} lineClamp={2} />
      </div>
    )

    // Expand first
    cy.contains('Read more').click()
    cy.contains('Read less').should('be.visible')

    // Collapse
    cy.contains('Read less').click()
    cy.contains('Read more').should('be.visible')
    cy.get('.default-style').should('have.css', '-webkit-line-clamp', '2')
  })

  it('toggles expansion when clicking the text body', () => {
    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={longText} lineClamp={2} />
      </div>
    )

    // Click the text itself
    cy.get('.default-style').click()
    cy.contains('Read less').should('be.visible')

    // Click again to collapse
    cy.get('.default-style').click()
    cy.contains('Read more').should('be.visible')
  })

  it('does not toggle when clicking a link inside the text', () => {
    const textWithLink = `
      <p>
        Here is some text with a <a href="#" id="test-link">Link</a> inside it.
        We want to make sure clicking the link does not toggle the expansion state,
        but clicking elsewhere does.
        Adding more text to ensure it clamps...
        Adding more text to ensure it clamps...
        Adding more text to ensure it clamps...
      </p>
    `

    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={textWithLink} lineClamp={2} />
      </div>
    )

    // Ensure it is clamped
    cy.contains('Read more').should('be.visible')

    // Click the link
    cy.get('#test-link').click()

    // Should stay clamped (Read more still visible)
    cy.contains('Read more').should('be.visible')
  })

  it('respects different maxLines prop', () => {
    cy.mount(
      <div style={{ width: '200px' }}>
        <ExpandableHtml html={longText} lineClamp={5} />
      </div>
    )

    cy.get('.default-style').should('have.css', '-webkit-line-clamp', '5')
  })

  it('applies custom className', () => {
    cy.mount(<ExpandableHtml html={shortText} className="custom-test-class" />)
    cy.get('.custom-test-class').should('exist')
  })

  it('updates clamping when resized', () => {
    // Text that should wrap at 200px but fit at 800px
    const resizeText = '<p>This is a sentence that should wrap when the container is narrow but fit on one line when the container is wide enough.</p>'

    cy.mount(
      <div id="resize-container" style={{ width: '200px', transition: 'none' }}>
        <ExpandableHtml html={resizeText} lineClamp={1} />
      </div>
    )

    // Should be clamped initially (narrow)
    cy.contains('Read more').should('be.visible')

    // Resize container to be wide
    cy.get('#resize-container').invoke('attr', 'style', 'width: 800px; transition: none;')

    // Give ResizeObserver time to fire and state to update
    cy.wait(100)

    // Should NOT be clamped anymore
    cy.contains('Read more').should('not.exist')

    // Resize container back to narrow
    cy.get('#resize-container').invoke('attr', 'style', 'width: 200px; transition: none;')

    // Should be clamped again
    cy.contains('Read more').should('be.visible')
  })
})
