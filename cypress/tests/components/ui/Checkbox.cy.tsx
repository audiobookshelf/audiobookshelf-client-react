import React from 'react'
import Checkbox from '@/components/ui/Checkbox'

describe('<Checkbox />', () => {
  it('renders', () => {
    cy.mount(<Checkbox />)
    cy.get('input[type="checkbox"]').should('exist')
    cy.get('[cy-id="checkbox-and-label-wrapper"]').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<Checkbox label="Test Label" />)
    cy.get('[cy-id="checkbox-label"]').should('contain.text', 'Test Label')
  })

  it('renders without label', () => {
    cy.mount(<Checkbox />)
    cy.get('input[type="checkbox"]').should('exist')
    cy.get('[cy-id="checkbox-label"]').should('not.exist')
  })

  describe('Size Variants', () => {
    it('applies default (medium) size styles', () => {
      cy.mount(<Checkbox label="Default Checkbox" value={true} />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'w-5')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'h-5')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'text-sm')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'md:text-base')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'pl-2')
      cy.get('svg').should('have.class', 'w-3.5')
      cy.get('svg').should('have.class', 'h-3.5')
    })

    it('applies small variant styles', () => {
      cy.mount(<Checkbox size="small" label="Small Checkbox" value={true} />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'w-4')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'h-4')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'text-xs')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'md:text-sm')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'pl-1')
      cy.get('svg').should('have.class', 'w-3')
      cy.get('svg').should('have.class', 'h-3')
    })

    it('applies large variant styles', () => {
      cy.mount(<Checkbox size="large" label="Large Checkbox" value={true} />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'w-6')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'h-6')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'text-base')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'md:text-lg')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'pl-2')
      cy.get('svg').should('have.class', 'w-4')
      cy.get('svg').should('have.class', 'h-4')
    })

    it('handles wrapper height classes correctly', () => {
      cy.mount(<Checkbox size="small" label="Small Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'h-8.5')
    })

    it('handles medium wrapper height classes correctly', () => {
      cy.mount(<Checkbox size="medium" label="Medium Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'h-9.5')
    })

    it('handles large wrapper height classes correctly', () => {
      cy.mount(<Checkbox size="large" label="Large Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'h-10.5')
    })
  })

  describe('Visual States', () => {
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

    it('handles partial state with correct styling', () => {
      cy.mount(<Checkbox partial label="Partial Checkbox" />)
      cy.get('.material-symbols').should('have.class', 'text-gray-400')
      cy.get('.material-symbols').should('have.class', 'text-base')
      cy.get('.material-symbols').should('have.class', 'leading-none')
    })

    it('shows correct cursor when enabled', () => {
      cy.mount(<Checkbox label="Enabled Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('not.have.class', 'cursor-pointer')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'cursor-pointer')
      cy.get('input[type="checkbox"]').should('have.class', 'cursor-pointer')
    })

    it('applies correct styles when disabled', () => {
      cy.mount(<Checkbox disabled label="Disabled Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'cursor-not-allowed')
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'bg-bg-disabled')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'text-disabled')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'cursor-not-allowed')
    })

    it('handles focus-within outline styling', () => {
      cy.mount(<Checkbox label="Focusable Checkbox" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'focus-within:outline')
    })
  })

  describe('Interaction', () => {
    it('calls onChange when clicked', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Checkbox onChange={onChangeSpy} />)
      cy.get('input[type="checkbox"]').click()
      cy.get('@onChangeSpy').should('have.been.calledWith', true)
    })

    it('calls onChange when label is clicked', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Checkbox label="Clickable Label" onChange={onChangeSpy} />)
      cy.get('[cy-id="checkbox-label"]').click()
      cy.get('@onChangeSpy').should('have.been.calledWith', true)
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
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      cy.mount(<Checkbox disabled label="Disabled Checkbox" />)
      cy.get('input[type="checkbox"]').should('be.disabled')
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'text-disabled')
      cy.get('input[type="checkbox"]').should('have.class', 'disabled:cursor-not-allowed')
    })

    it('does not call onChange when disabled', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Checkbox disabled onChange={onChangeSpy} />)
      cy.get('input[type="checkbox"]').realClick()
      cy.get('@onChangeSpy').should('not.have.been.called')
    })
  })

  describe('Customization', () => {
    it('applies custom checkbox background color', () => {
      cy.mount(<Checkbox checkboxBgClass="bg-blue-500" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'bg-blue-500')
    })

    it('applies custom border color', () => {
      cy.mount(<Checkbox borderColorClass="border-red-500" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border-red-500')
    })

    it('applies custom check color', () => {
      cy.mount(<Checkbox value={true} checkColorClass="text-blue-500" />)
      cy.get('svg').should('have.class', 'text-blue-500')
    })

    it('applies custom label class', () => {
      cy.mount(<Checkbox label="Custom Label" labelClass="custom-label-class" />)
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'custom-label-class')
    })

    it('applies custom className', () => {
      cy.mount(<Checkbox className="custom-checkbox-class" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'custom-checkbox-class')
    })

    it('handles multiple class names in className prop', () => {
      cy.mount(<Checkbox className="class1 class2 class3" />)
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'class1')
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'class2')
      cy.get('[cy-id="checkbox-and-label-wrapper"]').should('have.class', 'class3')
    })

    it('handles empty string className', () => {
      cy.mount(<Checkbox className="" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('exist')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border')
    })

    it('handles undefined className', () => {
      cy.mount(<Checkbox />)
      cy.get('[cy-id="checkbox-wrapper"]').should('exist')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border')
    })

    it('handles label class override', () => {
      cy.mount(<Checkbox label="Override Label" labelClass="override-class" />)
      cy.get('[cy-id="checkbox-label"]').should('have.class', 'override-class')
      cy.get('[cy-id="checkbox-label"]').should('not.have.class', 'pl-2')
    })

    it('handles disabled state with custom colors', () => {
      cy.mount(<Checkbox disabled checkboxBgClass="bg-blue-500" borderColorClass="border-red-500" checkColorClass="text-yellow-500" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'bg-blue-500')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border-red-500')
      cy.get('input[type="checkbox"]').should('be.disabled')
    })

    it('handles partial state with custom colors', () => {
      cy.mount(<Checkbox partial checkboxBgClass="bg-purple-500" borderColorClass="border-orange-500" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'bg-purple-500')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border-orange-500')
      cy.get('.material-symbols').should('exist')
    })

    it('handles checked state with custom colors', () => {
      cy.mount(<Checkbox value={true} checkboxBgClass="bg-pink-500" borderColorClass="border-cyan-500" checkColorClass="text-lime-500" />)
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'bg-pink-500')
      cy.get('[cy-id="checkbox-wrapper"]').should('have.class', 'border-cyan-500')
      cy.get('svg').should('have.class', 'text-lime-500')
    })
  })

  describe('Edge Cases', () => {
    it('handles complex label content', () => {
      cy.mount(<Checkbox label="Complex Label with Spaces" />)
      cy.get('[cy-id="checkbox-label"]').should('contain.text', 'Complex Label with Spaces')
    })

    it('handles empty label', () => {
      cy.mount(<Checkbox label="" />)
      cy.get('[cy-id="checkbox-label"]').should('not.exist')
      cy.get('input[type="checkbox"]').should('exist')
    })

    it('handles undefined label', () => {
      cy.mount(<Checkbox />)
      cy.get('[cy-id="checkbox-label"]').should('not.exist')
      cy.get('input[type="checkbox"]').should('exist')
    })
  })
})
