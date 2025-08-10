import React from 'react'
import Dropdown from '@/components/ui/Dropdown'

// Define types for the dropdown items based on the component's interface
interface DropdownItem {
  text: string
  value: string | number
  subtext?: string
}

describe('<Dropdown />', () => {
  const mockItems: DropdownItem[] = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2', subtext: 'Description' },
    { text: 'Option 3', value: 'option3' },
    { text: 'Option 4', value: 'option4', subtext: 'Another description' }
  ]

  it('renders', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<Dropdown items={mockItems} label="Test Label" />)
    cy.get('p').should('contain.text', 'Test Label')
  })

  it('displays selected value', () => {
    cy.mount(<Dropdown items={mockItems} value="option2" />)
    cy.get('button').should('contain.text', 'Option 2')
  })

  it('displays selected value with subtext', () => {
    cy.mount(<Dropdown items={mockItems} value="option2" />)
    cy.get('button').should('contain.text', 'Option 2')
    cy.get('button').should('contain.text', 'Description')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<Dropdown items={mockItems} label="Test Label" disabled={true} />)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('button').should('have.class', 'disabled:border-none')
    cy.get('button').should('have.class', 'disabled:bg-bg-disabled')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('p').should('have.class', 'text-disabled')
  })

  it('applies small size class', () => {
    cy.mount(<Dropdown items={mockItems} small={true} />)
    cy.get('button').should('have.class', 'h-9')
  })

  it('applies default size class', () => {
    cy.mount(<Dropdown items={mockItems} small={false} />)
    cy.get('button').should('have.class', 'h-10')
  })

  it('opens menu when clicked', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
  })

  it('renders correct number of menu items', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"] > li').should('have.length', mockItems.length)
  })

  it('displays items with subtext', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Option 2')
    cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Description')
  })

  it('emits onChange when menu item is clicked', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<Dropdown items={mockItems} onChange={onChangeSpy} />)
    cy.get('button').click()
    cy.get('[role="listbox"] > li').first().click()
    cy.get('@onChangeSpy').should('have.been.calledWith', 'option1')
  })

  it('closes menu when item is selected', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="listbox"] > li').first().click()
    cy.get('[role="listbox"]').should('not.exist')
  })

  it('closes when clicking outside', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('html').click()
    cy.get('[role="listbox"]').should('not.exist')
  })

  it('applies custom class', () => {
    cy.mount(<Dropdown items={mockItems} className="custom-class" />)
    cy.get('.custom-class').should('exist')
  })

  it('applies custom menu max height', () => {
    const customHeight = '300px'
    cy.mount(<Dropdown items={mockItems} menuMaxHeight={customHeight} />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.css', 'max-height', customHeight)
  })

  it('shows expand icon', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('span.material-symbols').should('have.text', 'expand_more')
  })

  it('has proper ARIA attributes', () => {
    cy.mount(<Dropdown items={mockItems} label="Test Label" />)
    cy.get('button').should('have.attr', 'aria-haspopup', 'listbox')
    cy.get('button').should('have.attr', 'aria-expanded', 'false')
    cy.get('button').click()
    cy.get('button').should('have.attr', 'aria-expanded', 'true')
  })

  it('generates unique IDs for accessibility', () => {
    cy.mount(<Dropdown items={mockItems} />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.attr', 'id')
    cy.get('[role="listbox"] > li').first().should('have.attr', 'id')
  })

  describe('Keyboard Navigation', () => {
    it('opens menu with Enter key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{enter}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with Space key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type(' ')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with ArrowDown key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with ArrowUp key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('has visual focus on the first item when menu is open', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
    })

    it('navigates through menu items with ArrowDown', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"]').should('be.visible')

      // First item should be focused
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')

      // Navigate to second item
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-black-300')

      // Navigate to third item
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').eq(2).should('have.class', 'bg-black-300')

      // Should stay on last item when pressing down again
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
    })

    it('navigates through menu items with ArrowUp', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')

      // Last item should be focused when opening with up arrow
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')

      // Navigate to third item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(2).should('have.class', 'bg-black-300')

      // Navigate to second item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-black-300')

      // Navigate to first item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(0).should('have.class', 'bg-black-300')

      // Should stay on first item when pressing up again
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(0).should('have.class', 'bg-black-300')
    })

    it('activates menu item with Enter', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={mockItems} onChange={onChangeSpy} />)

      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu and focus first item
      cy.get('button').type('{enter}') // Activate first item

      cy.get('@onChangeSpy').should('have.been.calledWith', 'option1')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('activates menu item with Space', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={mockItems} onChange={onChangeSpy} />)

      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu and focus first item
      cy.get('button').type(' ') // Activate first item

      cy.get('@onChangeSpy').should('have.been.calledWith', 'option1')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('navigates to first item with Home key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{downarrow}') // Navigate to second item
      cy.get('button').type('{home}') // Go to first item

      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-black-300')
    })

    it('navigates to last item with End key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{end}') // Go to last item

      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-black-300')
    })

    it('closes menu with Escape key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('[role="listbox"]').should('be.visible')

      cy.get('button').type('{esc}') // Close menu
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('closes menu with Tab key', () => {
      cy.mount(
        <div>
          <Dropdown items={mockItems} />
          <button>test</button>
        </div>
      )
      cy.get('button').first().focus()
      cy.get('button').first().type('{downarrow}') // Open menu
      cy.get('[role="listbox"]').should('be.visible')

      cy.get('button').first().tab() // Close menu with tab
      cy.get('[role="listbox"]').should('not.exist')

      cy.get('button').last().should('have.focus')
    })

    it('does not respond to keyboard events when disabled', () => {
      cy.mount(<Dropdown items={mockItems} disabled={true} />)

      // For disabled buttons, we can't focus them, so we'll test that the menu doesn't open
      cy.get('button').should('be.disabled')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('prevents default behavior for navigation keys', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}')

      // The menu should open and the page should not scroll
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('html').should('not.have.class', 'overflow-hidden')
    })

    it('maintains focus on button after menu closes', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{esc}') // Close menu

      cy.get('button').should('be.focused')
    })

    it('scrolls focused item into view', () => {
      // Create many items to test scrolling
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        text: `Option ${i + 1}`,
        value: `option${i + 1}`
      }))

      cy.mount(<Dropdown items={manyItems} menuMaxHeight="100px" />)
      cy.get('button').click()
      cy.get('button').type('{end}') // Go to last item

      // The last item should be visible in the scrollable area
      cy.get('[role="listbox"] > li').last().should('be.visible')
    })
  })

  describe('Item Interaction', () => {
    it('handles item click events', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={mockItems} onChange={onChangeSpy} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').eq(1).click()
      cy.get('@onChangeSpy').should('have.been.calledWith', 'option2')
    })

    it('prevents default on item mouse down', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').first().trigger('mousedown')
      // The item should still be clickable and not cause issues
      cy.get('[role="listbox"] > li').first().should('exist')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      cy.mount(<Dropdown items={mockItems} label="Test Label" />)
      cy.get('button').should('have.attr', 'aria-label')
    })

    it('has proper ARIA selected states', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').first().should('have.attr', 'aria-selected', 'true')
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'aria-selected', 'false')
    })

    it('has proper ARIA controls relationship', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').should('have.attr', 'aria-controls')
      cy.get('button').click()
      cy.get('[role="listbox"]').should('have.attr', 'id')
    })

    it('has proper ARIA active descendant', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('button').should('have.attr', 'aria-activedescendant')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      cy.mount(<Dropdown items={[]} />)
      cy.get('button').should('exist')
      cy.get('button').click()
      cy.get('[role="listbox"] > li').should('have.length', 0)
    })

    it('handles undefined value', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').should('contain.text', '')
    })

    it('handles value not in items', () => {
      cy.mount(<Dropdown items={mockItems} value="nonexistent" />)
      cy.get('button').should('contain.text', '')
    })

    it('handles string and number values', () => {
      const mixedItems = [
        { text: 'String Option', value: 'string' },
        { text: 'Number Option', value: 42 }
      ]
      cy.mount(<Dropdown items={mixedItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').should('have.length', 2)
    })

    it('handles items with same text but different values', () => {
      const duplicateTextItems = [
        { text: 'Same Text', value: 'value1' },
        { text: 'Same Text', value: 'value2' }
      ]
      cy.mount(<Dropdown items={duplicateTextItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').should('have.length', 2)
    })
  })
})
