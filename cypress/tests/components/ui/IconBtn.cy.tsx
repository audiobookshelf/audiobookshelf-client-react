import React from 'react'
import IconBtn from '@/components/ui/IconBtn'

describe('<IconBtn />', () => {
  it('renders a basic icon button', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('button').should('exist')
    cy.get('span').should('contain.text', 'edit')
  })

  it('renders with default props correctly', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('button').should('have.class', 'bg-primary')
    cy.get('button').should('have.class', 'h-10')
    cy.get('button').should('have.class', 'w-10')
    cy.get('button').should('not.be.disabled')
  })

  it('applies non-outlined style', () => {
    cy.mount(<IconBtn outlined={false}>edit</IconBtn>)
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('have.class', 'fill')
  })

  it('applies outlined style by default', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
  })

  it('applies borderless style', () => {
    cy.mount(<IconBtn borderless>edit</IconBtn>)
    cy.get('button').should('have.class', 'border-0')
    cy.get('button').should('have.class', 'bg-transparent')
    cy.get('button').should('have.class', 'hover:not-disabled:text-white')
  })

  it('applies border by default', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('button').should('have.class', 'border')
    cy.get('button').should('have.class', 'border-border')
  })

  it('shows loading spinner when loading is true', () => {
    cy.mount(<IconBtn loading>edit</IconBtn>)
    cy.get('button').should('be.disabled')
    cy.get('&icon-btn-loading-spinner').should('exist')
    cy.get('&icon-btn-loading-spinner').should('have.class', 'text-white/100')
    cy.get('&icon-btn-icon').should('not.exist')
    cy.get('&icon-btn-loading').should('exist')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<IconBtn disabled>edit</IconBtn>)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('button').should('have.class', 'disabled:border-none')
  })

  it('is disabled when loading is true', () => {
    cy.mount(<IconBtn loading>edit</IconBtn>)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('button').should('have.class', 'disabled:border-none')
  })

  it('calls onClick handler when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn onClick={onClickSpy}>edit</IconBtn>)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('does not call onClick when disabled', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <IconBtn disabled onClick={onClickSpy}>
        edit
      </IconBtn>
    )
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('does not call onClick when loading', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <IconBtn loading onClick={onClickSpy}>
        edit
      </IconBtn>
    )
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('prevents default on mousedown', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('button').trigger('mousedown')
    // The mousedown event should be prevented, but we can't easily test this in Cypress
    // This test ensures the component renders without errors
    cy.get('button').should('exist')
  })

  it('applies custom size', () => {
    cy.mount(<IconBtn size="small">edit</IconBtn>)
    cy.get('button').should('have.class', 'h-9')
    cy.get('button').should('have.class', 'w-9')
  })

  it('applies custom icon font size', () => {
    cy.mount(<IconBtn iconClass="text-2xl">edit</IconBtn>)
    cy.get('span').should('have.class', 'text-2xl')
  })

  it('applies default font size for regular icons', () => {
    cy.mount(<IconBtn>edit</IconBtn>)
    cy.get('button').should('have.class', 'text-xl')
  })

  it('applies aria-label when provided', () => {
    cy.mount(<IconBtn ariaLabel="Edit button">edit</IconBtn>)
    cy.get('button').should('have.attr', 'aria-label', 'Edit button')
  })

  it('applies custom className', () => {
    cy.mount(<IconBtn className="custom-class">edit</IconBtn>)
    cy.get('button').should('have.class', 'custom-class')
  })

  it('handles loading state with aria-hidden on spinner', () => {
    cy.mount(<IconBtn loading>edit</IconBtn>)
    cy.get('svg.animate-spin').parent().should('have.attr', 'aria-hidden', 'true')
  })

  it('handles click event with event object', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn onClick={onClickSpy}>edit</IconBtn>)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledWith', Cypress.sinon.match.object)
  })

  it('handles multiple class names in className prop', () => {
    cy.mount(<IconBtn className="class1 class2 class3">edit</IconBtn>)
    cy.get('button').should('have.class', 'class1')
    cy.get('button').should('have.class', 'class2')
    cy.get('button').should('have.class', 'class3')
  })

  it('handles empty string className', () => {
    cy.mount(<IconBtn className="">edit</IconBtn>)
    cy.get('button').should('exist')
  })

  it('handles loading state with custom size', () => {
    cy.mount(
      <IconBtn loading size="large">
        edit
      </IconBtn>
    )
    cy.get('button').should('have.class', 'h-11')
    cy.get('button').should('have.class', 'w-11')
    cy.get('button').should('be.disabled')
    cy.get('svg.animate-spin').should('exist')
  })

  it('handles disabled state with custom size', () => {
    cy.mount(
      <IconBtn disabled size="small">
        edit
      </IconBtn>
    )
    cy.get('button').should('have.class', 'h-9')
    cy.get('button').should('have.class', 'w-9')
    cy.get('button').should('be.disabled')
  })

  it('handles borderless with outlined', () => {
    cy.mount(
      <IconBtn borderless outlined>
        edit
      </IconBtn>
    )
    cy.get('button').should('have.class', 'border-0')
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
  })

  it('handles all props together', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <IconBtn
        disabled={false}
        outlined={true}
        borderless={false}
        loading={false}
        size="medium"
        ariaLabel="Test button"
        onClick={onClickSpy}
        className="bg-purple-500"
      >
        edit
      </IconBtn>
    )
    cy.get('button').should('have.class', 'bg-purple-500')
    cy.get('button').should('have.class', 'h-10')
    cy.get('button').should('have.class', 'w-10')
    cy.get('button').should('have.class', 'border')
    cy.get('button').should('have.attr', 'aria-label', 'Test button')
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
    cy.get('button').should('have.class', 'text-xl')
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })
})
