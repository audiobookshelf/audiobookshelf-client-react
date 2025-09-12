import React from 'react'
import Label from '@/components/ui/Label'

describe('<Label />', () => {
  it('renders with basic text content', () => {
    cy.mount(<Label>Basic Label</Label>)
    cy.get('[cy-id="label"]').should('contain.text', 'Basic Label')
    cy.get('[cy-id="label"]').should('have.class', 'text-sm')
    cy.get('[cy-id="label"]').should('have.class', 'font-semibold')
  })

  it('renders with custom id', () => {
    cy.mount(<Label id="custom-label-id">Label with ID</Label>)
    cy.get('[cy-id="label"]').should('have.id', 'custom-label-id')
  })

  it('renders with htmlFor attribute', () => {
    cy.mount(<Label htmlFor="input-id">Label for Input</Label>)
    cy.get('[cy-id="label"]').should('have.attr', 'for', 'input-id')
  })

  it('applies default styles correctly', () => {
    cy.mount(<Label>Default Styles</Label>)
    cy.get('[cy-id="label"]').should('have.class', 'w-fit')
    cy.get('[cy-id="label"]').should('have.class', 'text-sm')
    cy.get('[cy-id="label"]').should('have.class', 'font-semibold')
    cy.get('[cy-id="label"]').should('have.class', 'px-1')
    cy.get('[cy-id="label"]').should('have.class', 'block')
    cy.get('[cy-id="label"]').should('have.class', 'mb-1')
  })

  it('applies disabled styles when disabled is true', () => {
    cy.mount(<Label disabled>Disabled Label</Label>)
    cy.get('[cy-id="label"]').should('have.class', 'text-disabled')
  })

  it('does not apply disabled styles when disabled is false', () => {
    cy.mount(<Label disabled={false}>Enabled Label</Label>)
    cy.get('[cy-id="label"]').should('not.have.class', 'text-disabled')
  })

  it('applies custom className', () => {
    cy.mount(<Label className="custom-label-class">Custom Class Label</Label>)
    cy.get('[cy-id="label"]').should('have.class', 'custom-label-class')
    cy.get('[cy-id="label"]').should('have.class', 'text-sm') // Should still have base classes
  })

  it('applies multiple custom classes', () => {
    cy.mount(<Label className="class1 class2 class3">Multiple Classes</Label>)
    cy.get('[cy-id="label"]').should('have.class', 'class1')
    cy.get('[cy-id="label"]').should('have.class', 'class2')
    cy.get('[cy-id="label"]').should('have.class', 'class3')
  })

  it('handles complex children content', () => {
    cy.mount(
      <Label>
        <span>Complex</span> <i>Label</i> Content
      </Label>
    )
    cy.get('[cy-id="label"]').should('contain.text', 'Complex')
    cy.get('[cy-id="label"]').should('contain.text', 'Label')
    cy.get('[cy-id="label"]').should('contain.text', 'Content')
    cy.get('[cy-id="label"] span').should('contain.text', 'Complex')
    cy.get('[cy-id="label"] i').should('contain.text', 'Label')
  })

  describe('Click Handling', () => {
    it('calls onClick when clicked and not disabled', () => {
      const onClickSpy = cy.spy().as('onClickSpy')
      cy.mount(<Label onClick={onClickSpy}>Clickable Label</Label>)
      cy.get('[cy-id="label"]').click()
      cy.get('@onClickSpy').should('have.been.calledOnce')
    })

    it('does not call onClick when disabled', () => {
      const onClickSpy = cy.spy().as('onClickSpy')
      cy.mount(
        <Label disabled onClick={onClickSpy}>
          Disabled Clickable Label
        </Label>
      )
      cy.get('[cy-id="label"]').click()
      cy.get('@onClickSpy').should('not.have.been.called')
    })

    it('does not call onClick when onClick is not provided', () => {
      cy.mount(<Label>Non-clickable Label</Label>)
      cy.get('[cy-id="label"]').click()
      // Should not throw any errors
      cy.get('[cy-id="label"]').should('exist')
    })

    it('handles click with all props combined', () => {
      const onClickSpy = cy.spy().as('onClickSpy')
      cy.mount(
        <Label id="combined-label" htmlFor="combined-input" className="combined-class" onClick={onClickSpy}>
          Combined Label
        </Label>
      )
      cy.get('[cy-id="label"]').click()
      cy.get('@onClickSpy').should('have.been.calledOnce')
      cy.get('[cy-id="label"]').should('have.id', 'combined-label')
      cy.get('[cy-id="label"]').should('have.attr', 'for', 'combined-input')
      cy.get('[cy-id="label"]').should('have.class', 'combined-class')
    })
  })

  describe('Accessibility', () => {
    it('is a proper label element', () => {
      cy.mount(<Label>Accessible Label</Label>)
      cy.get('[cy-id="label"]').should('match', 'label')
    })

    it('associates with form control using htmlFor', () => {
      cy.mount(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" />
        </div>
      )
      cy.get('[cy-id="label"]').should('have.attr', 'for', 'test-input')
      cy.get('input').should('have.id', 'test-input')
    })

    it('focuses associated input when clicked', () => {
      cy.mount(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" cy-id="test-input" />
        </div>
      )
      cy.get('[cy-id="label"]').click()
      cy.get('[cy-id="test-input"]').should('be.focused')
    })
  })

  describe('Edge Cases', () => {
    it('handles null/undefined children gracefully', () => {
      cy.mount(<Label>{null}</Label>)
      cy.get('[cy-id="label"]').should('exist')
    })

    it('handles empty string className', () => {
      cy.mount(<Label className="">Empty Class Label</Label>)
      cy.get('[cy-id="label"]').should('exist')
      cy.get('[cy-id="label"]').should('have.class', 'text-sm')
    })

    it('handles undefined className', () => {
      cy.mount(<Label>Undefined Class Label</Label>)
      cy.get('[cy-id="label"]').should('exist')
      cy.get('[cy-id="label"]').should('have.class', 'text-sm')
    })

    it('handles boolean children', () => {
      cy.mount(<Label>{true}</Label>)
      cy.get('[cy-id="label"]').should('exist')
    })

    it('handles number children', () => {
      cy.mount(<Label>{42}</Label>)
      cy.get('[cy-id="label"]').should('contain.text', '42')
    })

    it('combines disabled state with custom classes correctly', () => {
      cy.mount(
        <Label disabled className="custom-disabled-class">
          Disabled Custom
        </Label>
      )
      cy.get('[cy-id="label"]').should('have.class', 'text-disabled')
      cy.get('[cy-id="label"]').should('have.class', 'custom-disabled-class')
    })

    it('handles very long text content', () => {
      const longText = 'This is a very long label text that might wrap to multiple lines and should still render correctly with all the proper styling applied'
      cy.mount(<Label>{longText}</Label>)
      cy.get('[cy-id="label"]').should('contain.text', longText)
      cy.get('[cy-id="label"]').should('have.class', 'w-fit')
    })
  })

  describe('State Management', () => {
    it('re-renders correctly when props change', () => {
      const TestComponent = () => {
        const [disabled, setDisabled] = React.useState(false)
        const [text, setText] = React.useState('Initial Text')

        return (
          <div>
            <Label disabled={disabled}>{text}</Label>
            <button onClick={() => setDisabled(!disabled)} cy-id="toggle-disabled">
              Toggle Disabled
            </button>
            <button onClick={() => setText('Updated Text')} cy-id="update-text">
              Update Text
            </button>
          </div>
        )
      }

      cy.mount(<TestComponent />)

      // Initial state
      cy.get('[cy-id="label"]').should('contain.text', 'Initial Text')
      cy.get('[cy-id="label"]').should('not.have.class', 'text-disabled')

      // Toggle disabled
      cy.get('[cy-id="toggle-disabled"]').click()
      cy.get('[cy-id="label"]').should('have.class', 'text-disabled')

      // Update text
      cy.get('[cy-id="update-text"]').click()
      cy.get('[cy-id="label"]').should('contain.text', 'Updated Text')
      cy.get('[cy-id="label"]').should('have.class', 'text-disabled') // Should still be disabled
    })
  })
})
