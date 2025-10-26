import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'

// Define types for the menu items based on the component's interface
interface ContextMenuDropdownSubitem {
  text: string
  action: string
  data?: Record<string, string>
}

interface ContextMenuDropdownItem {
  text: string
  action: string
  subitems?: ContextMenuDropdownSubitem[]
}

describe('<ContextMenuDropdown />', () => {
  const mockItems: ContextMenuDropdownItem[] = [
    { text: 'Item 1', action: 'action1' },
    {
      text: 'Item 2',
      action: 'action2',
      subitems: [
        { text: 'Subitem 1', action: 'subaction1', data: { value: 'data1' } },
        { text: 'Subitem 2', action: 'subaction2', data: { value: 'data2' } }
      ]
    },
    { text: 'Item 3', action: 'action3' }
  ]

  it('renders', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
  })

  it('renders a button with more icon by default', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
    cy.get('button').should('exist')
    cy.get('span.material-symbols').should('have.text', 'more_vert')
  })

  it('shows loading spinner when processing', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} processing={true} />
      </div>
    )
    cy.get('button').should('not.exist')
    cy.get('&loading-spinner').should('exist')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} disabled={true} />
      </div>
    )
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
  })

  it('opens menu when clicked', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"]').should('be.visible')
  })

  it('renders correct number of menu items', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"] > *').should('have.length', mockItems.length)
  })

  it('shows submenu on hover', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
    cy.get('button').click()
    // Hover over the item with subitems (second item)
    cy.get('[role="menu"] > div > button').realHover()
    // Check if submenu appears
    cy.get('[role="menu"] button').should('have.length', 5) // 3 main items + 2 subitems
  })

  it('emits action when menu item is clicked', () => {
    const onActionSpy = cy.spy().as('onActionSpy')
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"] > button').first().click()
    cy.get('@onActionSpy').should('have.been.calledWith', { action: 'action1', data: undefined })
  })

  it('emits action with data when submenu item is clicked', () => {
    const onActionSpy = cy.spy().as('onActionSpy')
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"] > div > button').realHover()
    cy.get('[cy-id="submenu-1"]').should('be.visible')
    cy.get('[cy-id="submenu-1"] > button').eq(1).realClick()
    cy.get('@onActionSpy').should('have.been.calledWith', {
      action: 'subaction2',
      data: { value: 'data2' }
    })
  })

  it('closes when clicking outside', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"]').should('be.visible')
    cy.get('html').click()
    cy.get('[role="menu"]').should('not.exist')
  })

  it('applies custom icon class', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} iconClass="custom-icon" />
      </div>
    )
    cy.get('span.material-symbols').should('have.class', 'custom-icon')
  })

  it('applies custom menu width', () => {
    const customWidth = 300
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} menuWidth={customWidth} />
      </div>
    )
    cy.get('button').click()
    cy.get('[role="menu"]').should('have.css', 'width', `${customWidth}px`)
  })

  it('applies custom class', () => {
    cy.mount(
      <div className="absolute end-0">
        <ContextMenuDropdown items={mockItems} className="custom-class" />
      </div>
    )
    cy.get('&wrapper').should('have.class', 'custom-class')
  })

  it('applies custom menu align', () => {
    cy.mount(<ContextMenuDropdown items={mockItems} menuAlign="left" />)
    cy.get('button').click()
    cy.get('[role="menu"]').should('have.class', 'start-0')
  })

  it('applies auto width and uses menu width as minimal width', () => {
    cy.mount(<ContextMenuDropdown items={mockItems} menuAlign="left" autoWidth={true} menuWidth={144} />)
    cy.get('button').click()
    cy.get('[role="menu"]').should('have.class', 'inline-flex')
    cy.get('[role="menu"]').should('have.class', 'whitespace-nowrap')
    cy.get('[role="menu"]').should('have.class', 'flex-col')
    cy.get('[role="menu"]').should('have.css', 'min-width', '144px')
  })

  it('uses menu width for submenu width', () => {
    cy.mount(<ContextMenuDropdown items={mockItems} menuAlign="left" autoWidth={true} menuWidth={144} />)
    cy.get('button').click()
    // Hover over the item with subitems (second item)
    cy.get('[role="menu"] > div > button').realHover()
    // check submenu min-width
    cy.get('[cy-id="submenu-1"]').should('have.css', 'min-width', '144px')
  })

  it('displays submenu so that first item is top aligned with the parent item', () => {
    cy.mount(<ContextMenuDropdown items={mockItems} menuAlign="left" autoWidth={true} menuWidth={144} />)
    cy.get('button').click()
    // Hover over the item with subitems (second item)
    cy.get('[role="menu"] > div > button').realHover()
    // get the parent item, then get the first subitem
    cy.get('[role="menu"] > div > button').then(([parent]) => {
      const parentTop = parent.getBoundingClientRect().top
      cy.get('[cy-id="submenu-1"] > button')
        .eq(0)
        .then(([subitem]) => {
          const subitemTop = subitem.getBoundingClientRect().top
          expect(subitemTop).to.approximately(parentTop, 1)
        })
    })
  })

  describe('Keyboard Navigation', () => {
    it('opens menu with Enter key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )
      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{enter}')
      cy.get('[role="menu"]').should('be.visible')
    })

    it('opens menu with Space key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type(' ')
      cy.get('[role="menu"]').should('be.visible')
    })

    it('opens menu with ArrowDown key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[role="menu"]').should('be.visible')
    })

    it('opens menu with ArrowUp key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{uparrow}')
      cy.get('[role="menu"]').should('be.visible')
    })

    it('has visual focus on the first item when menu is open', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )
      cy.get('[type="button"]').click()
      cy.get('[role="menu"]').should('be.visible')
      cy.get('[role="menuitem"]').first().should('have.class', 'bg-white/10')
    })

    it('navigates through menu items with ArrowDown', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.get('[role="menu"]').should('be.visible')
      // First item should be focused
      cy.get('[role="menuitem"]').first().should('have.class', 'bg-white/10')

      // Navigate to second item
      cy.realType('{downarrow}')
      cy.get('[role="menuitem"]').eq(1).should('have.class', 'bg-white/10')

      // Navigate to third item
      cy.realType('{downarrow}')
      cy.get('[role="menuitem"]').last().should('have.class', 'bg-white/10')

      // Should stay on last item when pressing down again
      cy.realType('{downarrow}')
      cy.get('[role="menuitem"]').last().should('have.class', 'bg-white/10')
    })

    it('navigates through menu items with ArrowUp', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').should('have.focus')
      cy.realType('{uparrow}')
      cy.get('[role="menu"]').should('be.visible')

      // Last item should be focused when opening with up arrow
      cy.get('[role="menuitem"]', { timeout: 5000 }).last().should('have.class', 'bg-white/10')

      // Navigate to second item
      cy.realType('{uparrow}')
      cy.get('[role="menuitem"]').eq(1).should('have.class', 'bg-white/10')

      // Navigate to first item
      cy.realType('{uparrow}')
      cy.get('[role="menuitem"]').first().should('have.class', 'bg-white/10')

      // Should stay on first item when pressing up again
      cy.realType('{uparrow}')
      cy.get('[role="menuitem"]').first().should('have.class', 'bg-white/10')
    })

    it('opens submenu with ArrowRight', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.get('[role="menu"]').should('be.visible')
      cy.realType('{downarrow}') // Navigate to second item (has subitems)
      cy.realType('{rightarrow}')

      // Submenu should be visible
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // First subitem should be focused
      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')
    })

    it('navigates through submenu items with ArrowDown', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item
      cy.realType('{rightarrow}') // Open submenu

      // First subitem should be focused
      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')

      // Navigate to second subitem
      cy.realType('{downarrow}')
      cy.get('[cy-id="submenu-1"] > button').eq(1).should('have.class', 'bg-white/10')

      // Should stay on last subitem when pressing down again
      cy.realType('{downarrow}')
      cy.get('[cy-id="submenu-1"] > button').eq(1).should('have.class', 'bg-white/10')
    })

    it('navigates through submenu items with ArrowUp', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item
      cy.realType('{rightarrow}') // Open submenu

      // First subitem should be focused
      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')

      // Navigate to second subitem first
      cy.realType('{downarrow}')
      cy.realType('{uparrow}') // Go back to first subitem
      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')

      // Should stay on first subitem when pressing up again
      cy.realType('{uparrow}')
      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')
    })

    it('closes submenu with ArrowLeft', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{leftarrow}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('activates menu item with Enter', () => {
      const onActionSpy = cy.spy().as('onActionSpy')
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu and focus first item
      cy.get('[type="button"]').type('{enter}') // Activate first item

      cy.get('@onActionSpy').should('have.been.calledWith', { action: 'action1', data: undefined })
      cy.get('[role="menu"]').should('not.exist')
    })

    it('activates menu item with Space', () => {
      const onActionSpy = cy.spy().as('onActionSpy')
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu and focus first item
      cy.get('[type="button"]').type(' ') // Activate first item

      cy.get('@onActionSpy').should('have.been.calledWith', { action: 'action1', data: undefined })
      cy.get('[role="menu"]').should('not.exist')
    })

    it('activates submenu item with Enter', () => {
      const onActionSpy = cy.spy().as('onActionSpy')
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{rightarrow}') // Open submenu
      cy.get('[type="button"]').type('{enter}') // Activate first subitem

      cy.get('@onActionSpy').should('have.been.calledWith', { action: 'subaction1', data: { value: 'data1' } })
      cy.get('[role="menu"]').should('not.exist')
    })

    it('activates submenu item with Space', () => {
      const onActionSpy = cy.spy().as('onActionSpy')
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} onAction={onActionSpy} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{rightarrow}') // Open submenu
      cy.get('[type="button"]').type(' ') // Activate first subitem

      cy.get('@onActionSpy').should('have.been.calledWith', { action: 'subaction1', data: { value: 'data1' } })
      cy.get('[role="menu"]').should('not.exist')
    })

    it('toggles submenu with Enter when focused on item with subitems', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item (has subitems)
      cy.get('[type="button"]').type('{enter}') // Toggle submenu

      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.get('[type="button"]').type('{enter}') // Toggle submenu again
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('navigates to first item with Home key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{home}') // Go to first item

      cy.get('[role="menu"] > button').first().should('have.class', 'bg-white/10')
    })

    it('navigates to last item with End key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu
      cy.get('[type="button"]').type('{end}') // Go to last item

      cy.get('[role="menu"] > button').last().should('have.class', 'bg-white/10')
    })

    it('navigates to first submenu item with Home key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{rightarrow}') // Open submenu
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second subitem
      cy.get('[type="button"]').type('{home}') // Go to first subitem

      cy.get('[cy-id="submenu-1"] > button').first().should('have.class', 'bg-white/10')
    })

    it('navigates to last submenu item with End key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{rightarrow}') // Open submenu
      cy.get('[type="button"]').type('{end}') // Go to last subitem

      cy.get('[cy-id="submenu-1"] > button').last().should('have.class', 'bg-white/10')
    })

    it('closes menu with Escape key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu
      cy.get('[role="menu"]').should('be.visible')

      cy.get('[type="button"]').type('{esc}') // Close menu
      cy.get('[role="menu"]').should('not.exist')
    })

    it('closes submenu with Escape key and keeps main menu open', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')
      cy.get('[type="button"]').type('{downarrow}') // Navigate to second item
      cy.get('[type="button"]').type('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.get('[type="button"]').type('{esc}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[role="menu"]').should('be.visible') // Main menu should still be open
    })

    it('closes menu with Tab key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
          <button>test</button>
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu
      cy.get('[role="menu"]').should('be.visible')

      cy.get('[type="button"]').tab() // Close menu with tab
      cy.get('[role="menu"]').should('not.exist')
    })

    it('does not respond to keyboard events when disabled', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} disabled={true} />
        </div>
      )

      // For disabled buttons, we can't focus them, so we'll test that the menu doesn't open
      cy.get('[type="button"]').should('be.disabled')
      cy.get('[role="menu"]').should('not.exist')
    })

    it('prevents default behavior for navigation keys', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}')

      // The menu should open and the page should not scroll
      cy.get('[role="menu"]').should('be.visible')
      cy.get('html').should('not.have.class', 'overflow-hidden')
    })

    it('maintains focus on button after menu closes', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItems} />
        </div>
      )

      cy.get('[type="button"]').focus()
      cy.get('[type="button"]').type('{downarrow}') // Open menu
      cy.get('[type="button"]').type('{esc}') // Close menu

      cy.get('[type="button"]').should('be.focused')
    })
  })

  describe('Empty submenus', () => {
    const mockItemsWithEmptySubmenu: ContextMenuDropdownItem[] = [
      { text: 'Item 1', action: 'action1' },
      {
        text: 'Item 2',
        action: 'action2',
        subitems: [] // Empty submenu
      },
      {
        text: 'Item 3',
        action: 'action3',
        subitems: undefined // No submenu
      },
      {
        text: 'Item 4',
        action: 'action4',
        subitems: [
          { text: 'Subitem 1', action: 'subaction1', data: { value: 'data1' } },
          { text: 'Subitem 2', action: 'subaction2', data: { value: 'data2' } }
        ]
      }
    ]

    it('shows the parent item', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )
      cy.get('[type="button"]').click()
      cy.get('[role="menu"]').should('be.visible')
      cy.get('[cy-id="parent-item"]').should('have.length', 2)
    })

    it('opens empty submenu when pressing right arrow', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.get('[role="menu"]').should('be.visible')
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Try to open submenu

      // Submenu should be visible
      cy.get('[cy-id="no-items-subitem"]').should('be.visible')
      // Check if the no-items subitem is disabled
      cy.get('[cy-id="no-items-subitem"]').should('be.disabled')
      // Check if the no-items subitem is not visually focused
      cy.get('[cy-id="no-items-subitem"]').should('not.have.class', 'bg-white/10')
      // Focus should remain on the parent item
      cy.get('[cy-id="parent-item"]').first().should('have.class', 'bg-white/10')
    })

    it('toggles empty submenu with Enter', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{enter}') // Try to toggle submenu

      // Submenu should be visible
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{enter}') // Try to toggle submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('toggles empty submenu with Space', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType(' ') // Try to toggle submenu

      // Submenu should be visible
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType(' ') // Try to toggle submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('closes empty submenu with Escape key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{esc}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
    })

    it('closes empty submenu with Tab key', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
          <button>test</button>
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.get('[type="button"]').tab()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('not.exist')
    })

    it('closes empty submenu with left arrow', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{leftarrow}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
    })

    it('closes empty submenu and moves up with up arrow', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{uparrow}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
      cy.get('[cy-id="parent-item"]').first().should('not.have.class', 'bg-white/10')
      cy.get('[cy-id="action-item"]').first().should('have.class', 'bg-white/10')
    })

    it('closes empty submenu and moves down with down arrow', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )
      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{downarrow}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
      cy.get('[cy-id="parent-item"]').first().should('not.have.class', 'bg-white/10')
      cy.get('[cy-id="action-item"]').eq(1).should('have.class', 'bg-white/10')
    })

    it('closes empty submenu and moves to first item with Home', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )
      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{home}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
      cy.get('[cy-id="parent-item"]').first().should('not.have.class', 'bg-white/10')
      cy.get('[cy-id="action-item"]').first().should('have.class', 'bg-white/10')
    })

    it('closes empty submenu and moves to last item with End', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )
      cy.get('[type="button"]').click()
      cy.realType('{downarrow}') // Navigate to second item (has empty subitems)
      cy.realType('{rightarrow}') // Open submenu
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      cy.realType('{end}') // Close submenu
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="menu"]').should('be.visible')
      cy.get('[cy-id="parent-item"]').first().should('not.have.class', 'bg-white/10')
      cy.get('[cy-id="parent-item"]').last().should('have.class', 'bg-white/10')
    })

    it('shows empty submenu when hovering over parent item', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      // Hover over the item with empty subitems (second item)
      cy.get('[cy-id="parent-item"]').first().realHover()

      // Submenu should be visible
      cy.get('[cy-id="submenu-1"]').should('be.visible')
    })

    it('closes submenu when hovering away from parent item', () => {
      cy.mount(
        <div className="absolute end-0">
          <ContextMenuDropdown items={mockItemsWithEmptySubmenu} />
        </div>
      )

      cy.get('[type="button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('body').realHover()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })
  })
})
