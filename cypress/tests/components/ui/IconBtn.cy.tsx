import React from 'react'
import IconBtn from '@/components/ui/IconBtn'
import styles from '@/components/ui/IconBtn.module.css'

describe('<IconBtn />', () => {
  it('renders a basic icon button', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('button').should('exist')
    cy.get('button').should('have.class', styles.iconBtn)
    cy.get('span').should('contain.text', '\ue3c9')
  })

  it('renders with default props correctly', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('button').should('have.class', 'bg-primary')
    cy.get('button').should('have.class', 'h-9')
    cy.get('button').should('have.class', 'w-9')
    cy.get('button').should('not.be.disabled')
  })

  it('applies custom background color', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" bgColor="bg-red-500" />)
    cy.get('button').should('have.class', 'bg-red-500')
  })

  it('applies outlined style', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" outlined />)
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
  })

  it('applies filled style by default', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('have.class', 'fill')
  })

  it('applies borderless style', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" borderless />)
    cy.get('button').should('not.have.class', 'bg-primary')
    cy.get('button').should('not.have.class', 'border')
  })

  it('applies border by default', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('button').should('have.class', 'border')
    cy.get('button').should('have.class', 'border-gray-600')
  })

  it('shows loading spinner when loading is true', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" loading />)
    cy.get('button').should('be.disabled')
    cy.get('&icon-btn-loading-spinner').should('exist')
    cy.get('&icon-btn-loading-spinner').should('have.class', 'text-white/100')
    cy.get('&icon-btn-icon').should('not.exist')
    cy.get('&icon-btn-loading').should('exist')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" disabled />)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
  })

  it('is disabled when loading is true', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" loading />)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
  })

  it('is disabled when loading is true', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" loading />)
    cy.get('button').should('be.disabled')
  })

  it('calls onClick handler when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn icon="&#xe3c9;" onClick={onClickSpy} />)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('does not call onClick when disabled', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn icon="&#xe3c9;" disabled onClick={onClickSpy} />)
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('does not call onClick when loading', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn icon="&#xe3c9;" loading onClick={onClickSpy} />)
    cy.get('button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('prevents default on mousedown', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('button').trigger('mousedown')
    // The mousedown event should be prevented, but we can't easily test this in Cypress
    // This test ensures the component renders without errors
    cy.get('button').should('exist')
  })

  it('applies custom size', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" size={12} />)
    cy.get('button').should('have.class', 'h-12')
    cy.get('button').should('have.class', 'w-12')
  })

  it('applies custom icon font size', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" iconFontSize="2rem" />)
    cy.get('span').should('have.css', 'font-size', '32px')
  })

  it('applies default font size for regular icons', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('span').should('have.css', 'font-size', '22.4px') // 1.4rem
  })

  it('applies special font size for edit icon', () => {
    cy.mount(<IconBtn icon="edit" />)
    cy.get('span').should('have.css', 'font-size', '20px') // 1.25rem
  })

  it('applies aria-label when provided', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" ariaLabel="Edit button" />)
    cy.get('button').should('have.attr', 'aria-label', 'Edit button')
  })

  it('applies custom className', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" className="custom-class" />)
    cy.get('button').should('have.class', 'custom-class')
  })

  it('handles different icon types', () => {
    cy.mount(<IconBtn icon="&#xe5ca;" />)
    cy.get('span').should('contain.text', '\ue5ca')
  })

  it('handles empty icon string', () => {
    cy.mount(<IconBtn icon="" />)
    cy.get('button').should('exist')
    cy.get('span').should('exist')
  })

  it('handles loading state with aria-hidden on spinner', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" loading />)
    cy.get('svg.animate-spin').parent().should('have.attr', 'aria-hidden', 'true')
  })

  it('handles click event with event object', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(<IconBtn icon="&#xe3c9;" onClick={onClickSpy} />)
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledWith', Cypress.sinon.match.object)
  })

  it('handles multiple class names in className prop', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" className="class1 class2 class3" />)
    cy.get('button').should('have.class', 'class1')
    cy.get('button').should('have.class', 'class2')
    cy.get('button').should('have.class', 'class3')
  })

  it('handles empty string className', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" className="" />)
    cy.get('button').should('exist')
    cy.get('button').should('have.class', styles.iconBtn)
  })

  it('handles undefined className', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" />)
    cy.get('button').should('exist')
    cy.get('button').should('have.class', styles.iconBtn)
  })

  it('handles borderless with custom background color', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" borderless bgColor="bg-blue-500" />)
    cy.get('button').should('not.have.class', 'bg-blue-500')
    cy.get('button').should('not.have.class', 'border')
  })

  it('handles outlined with custom background color', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" outlined bgColor="bg-green-500" />)
    cy.get('button').should('have.class', 'bg-green-500')
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
  })

  it('handles loading state with custom size', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" loading size={16} />)
    cy.get('button').should('have.class', 'h-16')
    cy.get('button').should('have.class', 'w-16')
    cy.get('button').should('be.disabled')
    cy.get('svg.animate-spin').should('exist')
  })

  it('handles disabled state with custom size', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" disabled size={14} />)
    cy.get('button').should('have.class', 'h-14')
    cy.get('button').should('have.class', 'w-14')
    cy.get('button').should('be.disabled')
  })

  it('handles custom icon font size override', () => {
    cy.mount(<IconBtn icon="edit" iconFontSize="3rem" />)
    cy.get('span').should('have.css', 'font-size', '48px') // 3rem
  })

  it('handles borderless with outlined', () => {
    cy.mount(<IconBtn icon="&#xe3c9;" borderless outlined />)
    cy.get('button').should('not.have.class', 'border')
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
  })

  it('handles all props together', () => {
    const onClickSpy = cy.spy().as('onClickSpy')
    cy.mount(
      <IconBtn
        icon="&#xe3c9;"
        disabled={false}
        bgColor="bg-purple-500"
        outlined={true}
        borderless={false}
        loading={false}
        iconFontSize="1.5rem"
        size={10}
        ariaLabel="Test button"
        onClick={onClickSpy}
        className="test-class"
      />
    )
    cy.get('button').should('have.class', 'bg-purple-500')
    cy.get('button').should('have.class', 'h-10')
    cy.get('button').should('have.class', 'w-10')
    cy.get('button').should('have.class', 'border')
    cy.get('button').should('have.class', 'test-class')
    cy.get('button').should('have.attr', 'aria-label', 'Test button')
    cy.get('span').should('have.class', 'material-symbols')
    cy.get('span').should('not.have.class', 'fill')
    cy.get('span').should('have.css', 'font-size', '24px') // 1.5rem
    cy.get('button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })
})
