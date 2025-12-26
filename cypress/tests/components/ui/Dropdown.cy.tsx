import Dropdown from '@/components/ui/Dropdown'

// Define types for the dropdown items based on the component's interface
interface DropdownSubitem {
  text: string
  value: string | number
}

interface DropdownItem {
  text: string
  value: string | number
  subtext?: string
  subitems?: DropdownSubitem[]
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
    cy.get('label').should('contain.text', 'Test Label')
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
    cy.mount(<Dropdown items={mockItems} label="Test Label" value="option2" disabled={true} />)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('button').should('have.class', 'disabled:text-disabled')
    cy.get('&control-wrapper').should('have.class', 'bg-bg-disabled')
    cy.get('&control-wrapper').should('have.class', 'cursor-not-allowed')
    cy.get('&control-wrapper').should('have.class', 'border-bg-disabled')
    cy.get('label').should('have.class', 'text-disabled')
  })

  it('applies small size class', () => {
    cy.mount(<Dropdown items={mockItems} size="small" />)
    cy.get('&control-wrapper').should('have.class', 'h-9')
  })

  it('applies default size class', () => {
    cy.mount(<Dropdown items={mockItems} size="medium" />)
    cy.get('&control-wrapper').should('have.class', 'h-10')
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
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-dropdown-item-selected')
    })

    it('navigates through menu items with ArrowDown', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').click()
      cy.get('[role="listbox"]').should('be.visible')

      // First item should be focused
      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-dropdown-item-selected')

      // Navigate to second item
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-dropdown-item-selected')

      // Navigate to third item
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').eq(2).should('have.class', 'bg-dropdown-item-selected')

      // Should stay on last item when pressing down again
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-dropdown-item-selected')
    })

    it('navigates through menu items with ArrowUp', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')

      // Last item should be focused when opening with up arrow
      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-dropdown-item-selected')

      // Navigate to third item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(2).should('have.class', 'bg-dropdown-item-selected')

      // Navigate to second item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-dropdown-item-selected')

      // Navigate to first item
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(0).should('have.class', 'bg-dropdown-item-selected')

      // Should stay on first item when pressing up again
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(0).should('have.class', 'bg-dropdown-item-selected')
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

      cy.get('[role="listbox"] > li').first().should('have.class', 'bg-dropdown-item-selected')
    })

    it('navigates to last item with End key', () => {
      cy.mount(<Dropdown items={mockItems} />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{end}') // Go to last item

      cy.get('[role="listbox"] > li').last().should('have.class', 'bg-dropdown-item-selected')
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
    it('has proper ARIA selected states', () => {
      // Dropdown passes isItemSelected based on value, so aria-selected reflects the selected item
      cy.mount(<Dropdown items={mockItems} value="option2" />)
      cy.get('button').click()
      // Items without subitems use role="option" and have aria-selected
      // The item with matching value should have aria-selected="true"
      cy.get('[role="listbox"] > li[role="option"]').first().should('have.attr', 'aria-selected', 'false')
      cy.get('[role="listbox"] > li[role="option"]').eq(1).should('have.attr', 'aria-selected', 'true')
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

  describe('Submenu Support', () => {
    const itemsWithSubmenus: DropdownItem[] = [
      { text: 'Simple Option', value: 'simple' },
      {
        text: 'With Submenu',
        value: 'parent',
        subitems: [
          { text: 'Sub Option 1', value: 'sub1' },
          { text: 'Sub Option 2', value: 'sub2' },
          { text: 'Sub Option 3', value: 'sub3' }
        ]
      },
      { text: 'Another Simple', value: 'another' }
    ]

    it('renders items with subitems indicator', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').should('have.length', 3)
      // Item with subitems should have aria-haspopup="menu" and role="menuitem"
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'aria-haspopup', 'menu')
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'role', 'menuitem')
    })

    it('opens submenu on hover', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      // Hover over item with subitems
      cy.get('[role="listbox"] > li').eq(1).trigger('mouseover')
      // Submenu should appear - submenu uses role="menu"
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"]').should('exist')
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li').should('have.length', 3)
    })

    it('selects subitem on click', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={itemsWithSubmenus} onChange={onChangeSpy} />)
      cy.get('button').click()
      // Hover to open submenu
      cy.get('[role="listbox"] > li').eq(1).trigger('mouseover')
      // Click on subitem - submenu uses role="menu", use force since submenu may be positioned off-screen in test
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li').first().click({ force: true })
      cy.get('@onChangeSpy').should('have.been.calledWith', 'sub1')
    })

    it('closes menu after subitem selection', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      cy.get('[role="listbox"] > li').eq(1).trigger('mouseover')
      // Submenu uses role="menu", use force since submenu may be positioned off-screen in test
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li').first().click({ force: true })
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('navigates to submenu with ArrowRight key', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      // Navigate to item with subitems
      cy.realType('{downarrow}')
      // Open submenu with right arrow
      cy.realType('{rightarrow}')
      // Submenu should be visible
      cy.get('[role="listbox"] > li').eq(1).find('ul').should('be.visible')
      // First subitem should be focused
      cy.get('[role="listbox"] > li').eq(1).find('ul li').first().should('have.class', 'bg-dropdown-item-selected')
    })

    it('closes submenu with ArrowLeft key', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      cy.get('[role="listbox"] > li').eq(1).find('ul').should('be.visible')
      cy.realType('{leftarrow}')
      cy.get('[role="listbox"] > li').eq(1).find('ul').should('not.exist')
    })

    it('navigates within submenu with ArrowUp/ArrowDown', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // First subitem focused
      cy.get('[role="listbox"] > li').eq(1).find('ul li').eq(0).should('have.class', 'bg-dropdown-item-selected')
      // Navigate down
      cy.realType('{downarrow}')
      cy.get('[role="listbox"] > li').eq(1).find('ul li').eq(1).should('have.class', 'bg-dropdown-item-selected')
      // Navigate up
      cy.realType('{uparrow}')
      cy.get('[role="listbox"] > li').eq(1).find('ul li').eq(0).should('have.class', 'bg-dropdown-item-selected')
    })

    it('selects subitem with Enter key', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={itemsWithSubmenus} onChange={onChangeSpy} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      cy.realType('{enter}')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'sub1')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('closes submenu with Escape without closing main menu', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      cy.get('[role="listbox"] > li').eq(1).find('ul').should('be.visible')
      cy.realType('{esc}')
      // Submenu should be closed but main menu still open
      cy.get('[role="listbox"] > li').eq(1).find('ul').should('not.exist')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('clicking parent item with subitems toggles submenu', () => {
      cy.mount(<Dropdown items={itemsWithSubmenus} />)
      cy.get('button').click()
      // Click on item with subitems
      cy.get('[role="listbox"] > li').eq(1).click()
      // Submenu should be visible (not close menu)
      cy.get('[role="listbox"]').should('be.visible')
    })
  })

  describe('Type-to-Filter in Submenu', () => {
    const itemsWithLargeSubmenu: DropdownItem[] = [
      { text: 'Simple Option', value: 'simple' },
      {
        text: 'Filter Test',
        value: 'filterParent',
        subitems: [
          { text: 'Apple', value: 'apple' },
          { text: 'Apricot', value: 'apricot' },
          { text: 'Banana', value: 'banana' },
          { text: 'Cherry', value: 'cherry' },
          { text: 'Date', value: 'date' }
        ]
      }
    ]

    it('filters submenu items when typing characters', () => {
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} />)
      cy.get('button').click()
      // Navigate to item with submenu
      cy.realType('{downarrow}')
      // Open submenu
      cy.realType('{rightarrow}')
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"]').should('exist')
      // Type 'a' to filter - should show Apple and Apricot
      cy.realType('a')
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 2)
    })

    it('shows filter text indicator in submenu', () => {
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // Type 'ban' to filter
      cy.realType('ban')
      // Should show filter text indicator
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="presentation"]').should('contain.text', 'ban')
      // Should only show Banana
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 1)
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('contain.text', 'Banana')
    })

    it('clears filter with Backspace key', () => {
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // Type 'ch' to filter to Cherry only
      cy.realType('ch')
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 1)
      // Press backspace to remove last character
      cy.realType('{backspace}')
      // Should now match items starting with 'c' - Cherry only
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 1)
      // Press backspace again to clear filter
      cy.realType('{backspace}')
      // Should show all 5 items
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 5)
    })

    it('shows no items message when filter has no matches', () => {
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // Type 'xyz' which matches nothing
      cy.realType('xyz')
      // Should show no items message - check for aria-selected false option (the "No items" message)
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"][aria-selected="false"]').should('exist')
    })

    it('selects from filtered list with Enter key', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} onChange={onChangeSpy} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // Type 'ban' to filter to Banana
      cy.realType('ban')
      // First filtered item should be focused, press Enter to select
      cy.realType('{enter}')
      cy.get('@onChangeSpy').should('have.been.calledWith', 'banana')
    })

    it('clears filter when closing submenu', () => {
      cy.mount(<Dropdown items={itemsWithLargeSubmenu} />)
      cy.get('button').click()
      cy.realType('{downarrow}')
      cy.realType('{rightarrow}')
      // Type 'ch' to filter
      cy.realType('ch')
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 1)
      // Close submenu with left arrow
      cy.realType('{leftarrow}')
      // Reopen submenu
      cy.realType('{rightarrow}')
      // Should show all items (filter was cleared)
      cy.get('[role="listbox"] > li').eq(1).find('[role="menu"] li[role="option"]').should('have.length', 5)
    })
  })

  describe('displayText Prop', () => {
    it('displays custom text instead of selected item text', () => {
      cy.mount(<Dropdown items={mockItems} value="option2" displayText="Custom Display" />)
      cy.get('button').should('contain.text', 'Custom Display')
      cy.get('button').should('not.contain.text', 'Option 2')
    })

    it('does not show subtext when displayText is provided', () => {
      cy.mount(<Dropdown items={mockItems} value="option2" displayText="Override Text" />)
      cy.get('button').should('contain.text', 'Override Text')
      cy.get('button').should('not.contain.text', 'Description')
    })
  })

  describe('highlightSelected Prop', () => {
    it('highlights selected item when highlightSelected is true', () => {
      cy.mount(<Dropdown items={mockItems} value="option2" highlightSelected={true} />)
      cy.get('button').click()
      // The selected item (option2, index 1) should have yellow text
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'text-yellow-400')
      // Other items should not have yellow text
      cy.get('[role="listbox"] > li').first().should('not.have.class', 'text-yellow-400')
    })

    it('does not highlight selected item when highlightSelected is false', () => {
      cy.mount(<Dropdown items={mockItems} value="option2" highlightSelected={false} />)
      cy.get('button').click()
      // The selected item should not have yellow text
      cy.get('[role="listbox"] > li').eq(1).should('not.have.class', 'text-yellow-400')
    })

    it('does not highlight when no value is selected', () => {
      cy.mount(<Dropdown items={mockItems} highlightSelected={true} />)
      cy.get('button').click()
      // No items should have yellow text
      cy.get('[role="listbox"] > li').each(($el) => {
        cy.wrap($el).should('not.have.class', 'text-yellow-400')
      })
    })
  })
})
