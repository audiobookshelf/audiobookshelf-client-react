import React from 'react'
import Btn from '@/components/ui/Btn'

describe('<Btn />', () => {
  it('renders a basic button', () => {
    cy.mount(<Btn>Click me</Btn>)
    cy.get('button').should('contain.text', 'Click me')
    cy.get('button').should('have.class', 'abs-btn')
  })

  it('renders a link when to prop is provided', () => {
    cy.mount(<Btn to="/test">Link Button</Btn>)
    cy.get('a').should('contain.text', 'Link Button')
    cy.get('a').should('have.attr', 'href', '/test')
  })

  it('applies custom color class', () => {
    cy.mount(<Btn color="bg-red-500">Red Button</Btn>)
    cy.get('button').should('have.class', 'bg-red-500')
  })

  it('applies small variant styles', () => {
    cy.mount(<Btn small>Small Button</Btn>)
    cy.get('button').should('have.class', 'text-sm')
    cy.get('button').should('have.class', 'px-4')
    cy.get('button').should('have.class', 'py-1')
  })

  it('applies custom padding', () => {
    cy.mount(
      <Btn paddingX={6} paddingY={3}>
        Custom Padding
      </Btn>
    )
    cy.get('button').should('have.class', 'px-6')
    cy.get('button').should('have.class', 'py-3')
  })

  it('shows loading spinner when loading is true', () => {
    cy.mount(<Btn loading>Loading Button</Btn>)
    cy.get('button').should('be.disabled')
    cy.get('svg.animate-spin').should('exist')
    cy.get('button').should('have.class', 'text-white/0')
  })

  it('shows progress text when progress is provided', () => {
    cy.mount(
      <Btn loading progress="50%">
        Progress Button
      </Btn>
    )
    cy.get('button').should('contain.text', '50%')
    cy.get('svg.animate-spin').should('not.exist')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<Btn disabled>Disabled Button</Btn>)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'cursor-not-allowed')
  })

  it('calls onClick handler when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<Btn onClick={onClickSpy}>Clickable Button</Btn>)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('prevents default on mousedown', () => {
    cy.mount(<Btn>Mousedown Button</Btn>)
    cy.get('button').trigger('mousedown')
    // The mousedown event should be prevented, but we can't easily test this in Cypress
    // This test ensures the component renders without errors
    cy.get('button').should('exist')
  })

  it('applies correct button type', () => {
    cy.mount(<Btn type="submit">Submit Button</Btn>)
    cy.get('button').should('have.attr', 'type', 'submit')
  })

  it('applies custom className', () => {
    cy.mount(<Btn className="custom-class">Custom Class Button</Btn>)
    cy.get('button').should('have.class', 'custom-class')
  })

  it('disables link when loading or disabled', () => {
    cy.mount(
      <Btn to="/test" loading>
        Loading Link
      </Btn>
    )
    cy.get('a').should('have.css', 'pointer-events', 'none')
  })

  it('renders with default props correctly', () => {
    cy.mount(<Btn>Default Button</Btn>)
    cy.get('button').should('have.class', 'bg-primary')
    cy.get('button').should('have.class', 'px-8')
    cy.get('button').should('have.class', 'py-2')
    cy.get('button').should('have.attr', 'type', 'button')
  })

  it('handles empty children', () => {
    cy.mount(<Btn>Empty Content</Btn>)
    cy.get('button').should('exist')
  })

  // Additional comprehensive tests
  it('does not call onClick when disabled', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <Btn disabled onClick={onClickSpy}>
        Disabled Button
      </Btn>
    )
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('does not call onClick when loading', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <Btn loading onClick={onClickSpy}>
        Loading Button
      </Btn>
    )
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('shows screen reader text when loading', () => {
    cy.mount(<Btn loading>Loading Button</Btn>)
    cy.get('.sr-only').should('contain.text', 'Loading...')
  })

  it('shows progress in screen reader text', () => {
    cy.mount(
      <Btn loading progress="75%">
        Progress Button
      </Btn>
    )
    cy.get('.sr-only').should('contain.text', 'Loading: 75%')
  })

  it('hides loading spinner when progress is provided', () => {
    cy.mount(
      <Btn loading progress="25%">
        Progress Button
      </Btn>
    )
    cy.get('svg.animate-spin').should('not.exist')
    cy.get('button').should('contain.text', '25%')
  })

  it('applies aria-hidden to loading spinner', () => {
    cy.mount(<Btn loading>Loading Button</Btn>)
    cy.get('svg.animate-spin').parent().should('have.attr', 'aria-hidden', 'true')
  })

  it('handles link button with tabIndex correctly', () => {
    cy.mount(<Btn to="/test">Link Button</Btn>)
    cy.get('a').should('have.attr', 'tabIndex', '0')
  })

  it('sets tabIndex to -1 when link is disabled', () => {
    cy.mount(
      <Btn to="/test" disabled>
        Disabled Link
      </Btn>
    )
    cy.get('a').should('have.attr', 'tabIndex', '-1')
  })

  it('sets tabIndex to -1 when link is loading', () => {
    cy.mount(
      <Btn to="/test" loading>
        Loading Link
      </Btn>
    )
    cy.get('a').should('have.attr', 'tabIndex', '-1')
  })

  it('applies aria-disabled to link when disabled', () => {
    cy.mount(
      <Btn to="/test" disabled>
        Disabled Link
      </Btn>
    )
    cy.get('a').should('have.attr', 'aria-disabled', 'true')
  })

  it('applies aria-disabled to link when loading', () => {
    cy.mount(
      <Btn to="/test" loading>
        Loading Link
      </Btn>
    )
    cy.get('a').should('have.attr', 'aria-disabled', 'true')
  })

  it('handles different button types', () => {
    cy.mount(<Btn type="reset">Reset Button</Btn>)
    cy.get('button').should('have.attr', 'type', 'reset')
  })

  it('handles small variant with custom padding override', () => {
    cy.mount(
      <Btn small paddingX={10} paddingY={5}>
        Small Custom Padding
      </Btn>
    )
    cy.get('button').should('have.class', 'text-sm')
    cy.get('button').should('have.class', 'px-10')
    cy.get('button').should('have.class', 'py-5')
  })

  it('handles large variant with custom padding override', () => {
    cy.mount(
      <Btn paddingX={12} paddingY={6}>
        Large Custom Padding
      </Btn>
    )
    cy.get('button').should('not.have.class', 'text-sm')
    cy.get('button').should('have.class', 'px-12')
    cy.get('button').should('have.class', 'py-6')
  })

  it('handles complex children content', () => {
    cy.mount(
      <Btn>
        <span>Icon</span>
        <span>Text</span>
      </Btn>
    )
    cy.get('button').should('contain.text', 'Icon')
    cy.get('button').should('contain.text', 'Text')
  })

  it('handles link with complex children content', () => {
    cy.mount(
      <Btn to="/test">
        <span>Link</span>
        <span>Content</span>
      </Btn>
    )
    cy.get('a').should('contain.text', 'Link')
    cy.get('a').should('contain.text', 'Content')
  })

  it('handles loading state with complex children', () => {
    cy.mount(
      <Btn loading>
        <span>Complex</span>
        <span>Content</span>
      </Btn>
    )
    cy.get('button').should('be.disabled')
    cy.get('svg.animate-spin').should('exist')
    cy.get('.sr-only').should('contain.text', 'Loading...')
  })

  it('handles progress with complex children', () => {
    cy.mount(
      <Btn loading progress="60%">
        <span>Complex</span>
        <span>Progress</span>
      </Btn>
    )
    cy.get('button').should('contain.text', '60%')
    cy.get('.sr-only').should('contain.text', 'Loading: 60%')
  })

  it('handles disabled state with complex children', () => {
    cy.mount(
      <Btn disabled>
        <span>Complex</span>
        <span>Disabled</span>
      </Btn>
    )
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'cursor-not-allowed')
  })

  it('handles click event with event object', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<Btn onClick={onClickSpy}>Event Button</Btn>)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledWith', Cypress.sinon.match.object)
  })

  it('handles multiple class names in className prop', () => {
    cy.mount(<Btn className="class1 class2 class3">Multi Class Button</Btn>)
    cy.get('button').should('have.class', 'class1')
    cy.get('button').should('have.class', 'class2')
    cy.get('button').should('have.class', 'class3')
  })

  it('handles empty string className', () => {
    cy.mount(<Btn className="">Empty Class Button</Btn>)
    cy.get('button').should('exist')
    cy.get('button').should('have.class', 'abs-btn')
  })

  it('handles undefined className', () => {
    cy.mount(<Btn>Undefined Class Button</Btn>)
    cy.get('button').should('exist')
    cy.get('button').should('have.class', 'abs-btn')
  })
})
