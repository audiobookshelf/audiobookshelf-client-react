import React from 'react'
import InputDropdown from '@/components/ui/InputDropdown'

describe('<InputDropdown />', () => {
  const mockItems = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']

  it('renders', () => {
    cy.mount(<InputDropdown items={mockItems} />)
    cy.get('input').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<InputDropdown items={mockItems} label="Test Label" />)
    cy.get('label').should('contain.text', 'Test Label')
  })

  it('displays initial value', () => {
    cy.mount(<InputDropdown items={mockItems} value="Banana" />)
    cy.get('input').should('have.value', 'Banana')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<InputDropdown items={mockItems} disabled={true} label="Test Label" />)
    cy.get('input').should('be.disabled')
    cy.get('input').should('have.attr', 'tabindex', '-1')
    cy.get('input').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('input').should('have.class', 'disabled:text-disabled')
    cy.get('input').should('have.class', 'bg-transparent')
    cy.get('[cy-id="control-wrapper"]').should('have.class', 'bg-bg-disabled')
    cy.get('[cy-id="label"]').should('have.class', 'text-disabled')
  })

  it('applies custom class', () => {
    cy.mount(<InputDropdown items={mockItems} className="custom-class" />)
    cy.get('.custom-class').should('exist')
  })

  it('opens menu when input is focused and has text', () => {
    cy.mount(<InputDropdown items={mockItems} />)
    cy.get('input').focus()
    cy.get('input').type('a')
    cy.get('[role="listbox"]').should('be.visible')
  })

  it('shows all items when showAllWhenEmpty is true', () => {
    cy.mount(<InputDropdown items={mockItems} showAllWhenEmpty={true} />)
    cy.get('input').focus()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="listbox"] > li').should('have.length', mockItems.length)
  })

  it('filters items based on input', () => {
    cy.mount(<InputDropdown items={mockItems} />)
    cy.get('input').focus()
    cy.get('input').type('a')
    cy.get('[role="listbox"] > li').should('have.length', 3) // Apple, Banana, Date
  })

  it('emits onChange when item is selected', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<InputDropdown items={mockItems} onChange={onChangeSpy} />)
    cy.get('input').focus()
    cy.get('input').type('a')
    cy.get('[role="listbox"] > li').first().click()
    cy.get('@onChangeSpy').should('have.been.calledWith', 'Apple')
  })

  it('emits onNewItem when new value is entered', () => {
    const onNewItemSpy = cy.spy().as('onNewItemSpy')
    cy.mount(<InputDropdown items={mockItems} onNewItem={onNewItemSpy} />)
    cy.get('input').focus()
    cy.get('input').type('New Fruit')
    cy.get('input').blur()
    cy.get('@onNewItemSpy').should('have.been.calledWith', 'New Fruit')
  })

  it('closes menu when clicking outside', () => {
    cy.mount(<InputDropdown items={mockItems} />)
    cy.get('input').focus()
    cy.get('input').type('a')
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('html').click({ force: true })
    cy.get('[role="listbox"]').should('not.exist')
  })

  it('shows selected item with checkmark', () => {
    cy.mount(<InputDropdown items={mockItems} value="Banana" />)
    cy.get('input').focus()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="listbox"] > li').first().find('.material-symbols').should('have.text', 'check')
  })

  it('shows "No items" when no matches found', () => {
    cy.mount(<InputDropdown items={mockItems} />)
    cy.get('input').focus()
    cy.get('input').type('xyz')
    cy.get('[cy-id="dropdown-menu-no-items"]').should('contain.text', 'No items')
  })

  describe('Keyboard Navigation', () => {
    it('opens menu with ArrowDown', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{downarrow}')
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
    })

    it('opens menu with ArrowUp', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('input').type('{uparrow}')
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
    })

    it('forces open menu on empty input with ArrowDown even when showAllWhenEmpty is false', () => {
      cy.mount(<InputDropdown items={mockItems} showAllWhenEmpty={false} />)
      cy.get('input').focus()
      cy.get('[role="listbox"]').should('not.exist')
      cy.get('input').type('{downarrow}')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] > li').should('have.length', mockItems.length)
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
    })

    it('forces open menu on empty input with ArrowUp even when showAllWhenEmpty is false', () => {
      cy.mount(<InputDropdown items={mockItems} showAllWhenEmpty={false} />)
      cy.get('input').focus()
      cy.get('[role="listbox"]').should('not.exist')
      cy.get('input').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] > li').should('have.length', mockItems.length)
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
    })

    it('navigates through items with ArrowDown', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{downarrow}')
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
      cy.get('input').type('{downarrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-black-300')
    })

    it('navigates through items with ArrowUp', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
      cy.get('input').type('{uparrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-black-300')
    })

    it('selects item with Enter', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<InputDropdown items={mockItems} onChange={onChangeSpy} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{downarrow}')
      cy.get('input').type('{enter}')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'Apple')
    })

    it('submits text input with Enter when no item is focused', () => {
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').type('New Item')
      cy.get('input').type('{enter}')
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'New Item')
    })

    it('closes menu with Escape', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('input').type('{esc}')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('navigates to first item with Home', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{downarrow}')
      cy.get('input').type('{downarrow}')
      cy.get('input').type('{home}')
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
    })

    it('navigates to last item with End', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{end}')
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
    })

    it('closes menu with Tab', () => {
      cy.mount(
        <div>
          <InputDropdown items={mockItems} />
          <button>test</button>
        </div>
      )
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('input').tab()
      cy.get('[role="listbox"]').should('not.exist')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      cy.mount(<InputDropdown items={mockItems} label="Test Label" />)
      cy.get('input').should('have.attr', 'aria-autocomplete', 'list')
      cy.get('input').should('have.attr', 'aria-controls')
      cy.get('input').should('have.attr', 'aria-expanded', 'false')
      cy.get('input').should('not.have.attr', 'aria-activedescendant')
    })

    it('has proper ARIA expanded state when menu is open', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').should('have.attr', 'aria-expanded', 'true')
      cy.get('input').should('not.have.attr', 'aria-activedescendant')
    })

    it('has proper ARIA active descendant', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('input').type('{downarrow}')
      cy.get('input').should('have.attr', 'aria-activedescendant')
    })

    it('has proper ARIA selected states', () => {
      cy.mount(<InputDropdown items={mockItems} value="Apple" />)
      cy.get('input').focus()
      cy.get('input').type('{backspace}{backspace}{backspace}{backspace}')
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] > li').eq(0).should('have.attr', 'aria-selected', 'true')
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'aria-selected', 'false')
    })

    it('generates unique IDs for accessibility', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('[role="listbox"]').should('have.attr', 'id')
      cy.get('[role="listbox"] > li').first().should('have.attr', 'id')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      cy.mount(<InputDropdown items={[]} />)
      cy.get('input').focus()
      cy.get('input').type('test')
      cy.get('[cy-id="dropdown-menu-no-items"]').should('contain.text', 'No items')
    })

    it('handles undefined value', () => {
      cy.mount(<InputDropdown items={mockItems} />)
      cy.get('input').should('have.value', '')
    })

    it('handles number values', () => {
      const numberItems = [1, 2, 3, 4, 5]
      cy.mount(<InputDropdown items={numberItems} />)
      cy.get('input').focus()
      cy.get('input').type('1')
      cy.get('[role="listbox"] > li').should('have.length', 1)
    })

    it('handles mixed string and number values', () => {
      const mixedItems = ['Apple', 1, 'Banana', 2]
      cy.mount(<InputDropdown items={mixedItems} />)
      cy.get('input').focus()
      cy.get('input').type('a')
      cy.get('[role="listbox"] > li').should('have.length', 2)
    })

    it('trims whitespace from input', () => {
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').type('  New Item  ')
      cy.get('input').blur()
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'New Item')
    })

    it('does not call onNewItem for empty input', () => {
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').blur()
      cy.get('@onNewItemSpy').should('not.have.been.called')
    })

    it('prevents duplicate events when pressing Enter multiple times quickly', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onChange={onChangeSpy} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').type('New Item')
      // Press Enter multiple times quickly
      cy.get('input').type('{enter}')
      cy.get('input').type('{enter}')
      cy.get('input').type('{enter}')
      // Should only be called once
      cy.get('@onNewItemSpy').should('have.been.calledOnce')
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'New Item')
      cy.get('@onChangeSpy').should('have.been.calledOnce')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'New Item')
    })

    it('prevents duplicate events when blurring multiple times quickly', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onChange={onChangeSpy} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').type('New Item')
      // Blur multiple times quickly
      cy.get('input').blur()
      cy.get('input').focus()
      cy.get('input').blur()
      cy.get('input').focus()
      cy.get('input').blur()
      // Should only be called once
      cy.get('@onNewItemSpy').should('have.been.calledOnce')
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'New Item')
      cy.get('@onChangeSpy').should('have.been.calledOnce')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'New Item')
    })

    it('allows new events when value changes', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      const onNewItemSpy = cy.spy().as('onNewItemSpy')
      cy.mount(<InputDropdown items={mockItems} onChange={onChangeSpy} onNewItem={onNewItemSpy} />)
      cy.get('input').focus()
      cy.get('input').type('First Item')
      cy.get('input').type('{enter}')
      // Change the input and submit again
      cy.get('input').clear()
      cy.get('input').type('Second Item')
      cy.get('input').type('{enter}')
      // Both should be called
      cy.get('@onNewItemSpy').should('have.been.calledTwice')
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'First Item')
      cy.get('@onNewItemSpy').should('have.been.calledWith', 'Second Item')
      cy.get('@onChangeSpy').should('have.been.calledTwice')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'First Item')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'Second Item')
    })
  })

  describe('Performance', () => {
    it('handles large item lists efficiently', () => {
      const largeItems = Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
      cy.mount(<InputDropdown items={largeItems} />)
      cy.get('input').focus()
      cy.get('input').type('Item 1')
      cy.get('[role="listbox"] > li').should('have.length.at.least', 1)
    })
  })
})
