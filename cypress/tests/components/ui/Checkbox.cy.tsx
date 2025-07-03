import React from 'react'
import Checkbox from '@/components/ui/Checkbox'

describe('<Checkbox />', () => {
  it('renders a basic checkbox', () => {
    cy.mount(<Checkbox />)
    cy.get('input[type="checkbox"]').should('exist')
    cy.get('label').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<Checkbox label="Test Label" />)
    cy.get('label').should('contain.text', 'Test Label')
  })

  it('applies small variant styles', () => {
    cy.mount(<Checkbox small label="Small Checkbox" />)
    cy.get('&checkbox-wrapper').should('have.class', 'w-4')
    cy.get('&checkbox-wrapper').should('have.class', 'h-4')
    cy.get('label').should('contain.text', 'Small Checkbox')
  })

  it('applies medium variant styles', () => {
    cy.mount(<Checkbox medium label="Medium Checkbox" />)
    cy.get('&checkbox-wrapper').should('have.class', 'w-5')
    cy.get('&checkbox-wrapper').should('have.class', 'h-5')
  })

  it('applies default size styles', () => {
    cy.mount(<Checkbox label="Default Checkbox" />)
    cy.get('&checkbox-wrapper').should('have.class', 'w-6')
    cy.get('&checkbox-wrapper').should('have.class', 'h-6')
  })

  it('shows check mark when checked', () => {
    cy.mount(<Checkbox value={true} />)
    cy.get('svg').should('exist')
    cy.get('svg path').should('have.attr', 'd', 'M0 11l2-2 5 5L18 3l2 2L7 18z')
  })

  it('shows partial indicator when partial is true', () => {
    cy.mount(<Checkbox partial />)
    cy.get('.material-symbols').should('contain.text', 'remove')
    cy.get('svg').should('not.exist')
  })

  it('calls onChange when clicked', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox onChange={onChangeSpy} />)
    cy.get('input[type="checkbox"]').click()
    cy.get('@onChangeSpy').should('have.been.calledWith', true)
  })

  it('calls onChange when label is clicked', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox label="Clickable Label" onChange={onChangeSpy} />)
    cy.get('label').click()
    cy.get('@onChangeSpy').should('have.been.calledWith', true)
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<Checkbox disabled label="Disabled Checkbox" />)
    cy.get('input[type="checkbox"]').should('be.disabled')
    cy.get('&checkbox-label').should('have.class', 'text-gray-400')
  })

  it('does not call onChange when disabled', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox disabled onChange={onChangeSpy} />)
    cy.get('input[type="checkbox"]').click({ force: true })
    cy.get('@onChangeSpy').should('not.have.been.called')
  })

  it('applies custom checkbox background color', () => {
    cy.mount(<Checkbox checkboxBg="blue-500" />)
    cy.get('&checkbox-wrapper').should('have.class', 'bg-blue-500')
  })

  it('applies custom border color', () => {
    cy.mount(<Checkbox borderColor="red-500" />)
    cy.get('&checkbox-wrapper').should('have.class', 'border-red-500')
  })

  it('applies custom check color', () => {
    cy.mount(<Checkbox value={true} checkColor="blue-500" />)
    cy.get('svg').should('have.class', 'text-blue-500')
  })

  it('applies custom label class', () => {
    cy.mount(<Checkbox label="Custom Label" labelClass="custom-label-class" />)
    cy.get('&checkbox-label').should('have.class', 'custom-label-class')
  })

  it('sets aria-label on input', () => {
    cy.mount(<Checkbox ariaLabel="Accessibility Label" />)
    cy.get('input[type="checkbox"]').should('have.attr', 'aria-label', 'Accessibility Label')
  })

  it('handles keyboard navigation with Enter key', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox label="Keyboard Checkbox" onChange={onChangeSpy} />)
    cy.get('label').focus().type('{enter}')
    cy.get('@onChangeSpy').should('have.been.calledWith', true)
  })

  it('toggles value when Enter key is pressed', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox value={true} label="Toggle Checkbox" onChange={onChangeSpy} />)
    cy.get('label').focus().type('{enter}')
    cy.get('@onChangeSpy').should('have.been.calledWith', false)
  })

  it('does not toggle when disabled and Enter key is pressed', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox disabled label="Disabled Keyboard Checkbox" onChange={onChangeSpy} />)
    cy.get('label').focus().type('{enter}')
    cy.get('@onChangeSpy').should('not.have.been.called')
  })

  it('applies custom className', () => {
    cy.mount(<Checkbox className="custom-checkbox-class" />)
    cy.get('label').should('have.class', 'custom-checkbox-class')
  })

  it('renders without label', () => {
    cy.mount(<Checkbox />)
    cy.get('input[type="checkbox"]').should('exist')
    cy.get('label').should('exist')
    // Should not have the label text div
    cy.get('label > div').should('have.length', 1)
  })

  it('handles controlled component behavior', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Checkbox value={false} onChange={onChangeSpy} />)
    cy.get('input[type="checkbox"]').should('not.be.checked')
    cy.get('input[type="checkbox"]').click()
    cy.get('@onChangeSpy').should('have.been.calledWith', true)
    // Value should not change until parent updates it
    cy.get('input[type="checkbox"]').should('not.be.checked')
  })

  it('shows correct cursor when enabled', () => {
    cy.mount(<Checkbox label="Enabled Checkbox" />)
    cy.get('label').should('have.class', 'cursor-pointer')
  })

  it('shows correct cursor when disabled', () => {
    cy.mount(<Checkbox disabled label="Disabled Checkbox" />)
    cy.get('label').should('not.have.class', 'cursor-pointer')
  })

  it('handles small variant with label styling', () => {
    cy.mount(<Checkbox small label="Small Label" />)
    cy.get('&checkbox-label').should('have.class', 'text-xs')
    cy.get('&checkbox-label').should('have.class', 'md:text-sm')
    cy.get('&checkbox-label').should('have.class', 'pl-1')
  })

  it('handles medium variant with label styling', () => {
    cy.mount(<Checkbox medium label="Medium Label" />)
    cy.get('&checkbox-label').should('have.class', 'text-base')
    cy.get('&checkbox-label').should('have.class', 'md:text-lg')
    cy.get('&checkbox-label').should('have.class', 'pl-2')
  })

  it('handles default variant with label styling', () => {
    cy.mount(<Checkbox label="Default Label" />)
    cy.get('&checkbox-label').should('have.class', 'pl-2')
    cy.get('&checkbox-label').should('not.have.class', 'text-xs')
    cy.get('&checkbox-label').should('not.have.class', 'text-base')
  })

  it('handles small variant with SVG sizing', () => {
    cy.mount(<Checkbox small value={true} />)
    cy.get('svg').should('have.class', 'w-3')
    cy.get('svg').should('have.class', 'h-3')
  })

  it('handles medium variant with SVG sizing', () => {
    cy.mount(<Checkbox medium value={true} />)
    cy.get('svg').should('have.class', 'w-3.5')
    cy.get('svg').should('have.class', 'h-3.5')
  })

  it('handles default variant with SVG sizing', () => {
    cy.mount(<Checkbox value={true} />)
    cy.get('svg').should('have.class', 'w-4')
    cy.get('svg').should('have.class', 'h-4')
  })

  it('handles partial state with correct styling', () => {
    cy.mount(<Checkbox partial label="Partial Checkbox" />)
    cy.get('.material-symbols').should('have.class', 'text-gray-400')
    cy.get('.material-symbols').should('have.class', 'text-base')
    cy.get('.material-symbols').should('have.class', 'leading-none')
  })

  it('handles complex label content', () => {
    cy.mount(<Checkbox label="Complex Label with Spaces" />)
    cy.get('&checkbox-label').should('contain.text', 'Complex Label with Spaces')
  })

  it('handles empty label', () => {
    cy.mount(<Checkbox label="" />)
    cy.get('&checkbox-label').should('not.exist')
    cy.get('input[type="checkbox"]').should('exist')
  })

  it('handles undefined label', () => {
    cy.mount(<Checkbox />)
    cy.get('&checkbox-label').should('not.exist')
    cy.get('input[type="checkbox"]').should('exist')
  })

  it('handles multiple class names in className prop', () => {
    cy.mount(<Checkbox className="class1 class2 class3" />)
    cy.get('label').should('have.class', 'class1')
    cy.get('label').should('have.class', 'class2')
    cy.get('label').should('have.class', 'class3')
  })

  it('handles empty string className', () => {
    cy.mount(<Checkbox className="" />)
    cy.get('&checkbox-wrapper').should('exist')
    cy.get('&checkbox-wrapper').should('have.class', 'border-2')
  })

  it('handles undefined className', () => {
    cy.mount(<Checkbox />)
    cy.get('&checkbox-wrapper').should('exist')
    cy.get('&checkbox-wrapper').should('have.class', 'border-2')
  })

  it('handles label class override', () => {
    cy.mount(<Checkbox label="Override Label" labelClass="override-class" />)
    cy.get('&checkbox-label').should('have.class', 'override-class')
    cy.get('&checkbox-label').should('not.have.class', 'pl-2')
  })

  it('handles disabled state with custom colors', () => {
    cy.mount(<Checkbox disabled checkboxBg="blue-500" borderColor="red-500" checkColor="yellow-500" />)
    cy.get('&checkbox-wrapper').should('have.class', 'bg-blue-500')
    cy.get('&checkbox-wrapper').should('have.class', 'border-red-500')
    cy.get('input[type="checkbox"]').should('be.disabled')
  })

  it('handles partial state with custom colors', () => {
    cy.mount(<Checkbox partial checkboxBg="purple-500" borderColor="orange-500" />)
    cy.get('&checkbox-wrapper').first().should('have.class', 'bg-purple-500')
    cy.get('&checkbox-wrapper').first().should('have.class', 'border-orange-500')
    cy.get('.material-symbols').should('exist')
  })

  it('handles checked state with custom colors', () => {
    cy.mount(<Checkbox value={true} checkboxBg="pink-500" borderColor="cyan-500" checkColor="lime-500" />)
    cy.get('&checkbox-wrapper').should('have.class', 'bg-pink-500')
    cy.get('&checkbox-wrapper').should('have.class', 'border-cyan-500')
    cy.get('svg').should('have.class', 'text-lime-500')
  })

  it('handles focus state for accessibility', () => {
    cy.mount(<Checkbox label="Focusable Checkbox" />)
    cy.get('label').focus()
    cy.get('label').should('be.focused')
  })

  it('handles tabindex correctly', () => {
    cy.mount(<Checkbox label="Tab Checkbox" />)
    cy.get('label').should('have.attr', 'tabindex', '0')
  })

  it('handles input tabindex correctly', () => {
    cy.mount(<Checkbox label="Input Tab Checkbox" />)
    cy.get('input[type="checkbox"]').should('have.attr', 'tabindex', '-1')
  })
}) 