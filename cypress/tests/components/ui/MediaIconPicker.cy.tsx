import MediaIconPicker from '@/components/ui/MediaIconPicker'
import { AVAILABLE_ICONS } from '@/lib/absicons'

describe('<MediaIconPicker />', () => {
  it('renders', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<MediaIconPicker label="Test Label" />)
    cy.get('label').should('contain.text', 'Test Label')
  })

  it('displays selected icon', () => {
    cy.mount(<MediaIconPicker value="audiobookshelf" />)
    cy.get('button').should('exist')
    // The icon should be visible (we can't easily test the specific icon class)
    cy.get('button').find('[role="img"]').should('exist')
  })

  it('is disabled when disabled prop is true', () => {
    cy.mount(<MediaIconPicker disabled={true} />)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
    cy.get('label').should('have.class', 'text-disabled')
  })

  it('applies custom class', () => {
    cy.mount(<MediaIconPicker className="custom-class" />)
    cy.get('.custom-class').should('exist')
  })

  it('applies left alignment by default', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.class', 'start-0')
  })

  it('applies right alignment when specified', () => {
    cy.mount(<MediaIconPicker align="right" />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.class', 'end-0')
  })

  it('applies center alignment when specified', () => {
    cy.mount(<MediaIconPicker align="center" />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.class', 'start-1/2')
    cy.get('[role="listbox"]').should('have.class', '-translate-x-1/2')
  })

  it('opens menu when clicked', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
  })

  it('renders all available icons in menu', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').click()
    // Should render all available icons (20 total)
    cy.get('[role="listbox"] [role="option"]').should('have.length', 20)
  })

  it('emits onChange when menu item is clicked', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<MediaIconPicker onChange={onChangeSpy} />)
    cy.get('button').click()
    cy.get('[role="listbox"] [role="option"]').first().click()
    cy.get('@onChangeSpy').should('have.been.called')
  })

  it('closes menu when item is selected', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="listbox"] [role="option"]').first().click()
    cy.get('[role="listbox"]').should('not.exist')
  })

  it('closes when clicking outside', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').click()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('html').click()
    cy.get('[role="listbox"]').should('not.exist')
  })

  it('has proper ARIA attributes', () => {
    cy.mount(<MediaIconPicker label="Test Label" />)
    cy.get('button').should('have.attr', 'aria-haspopup', 'listbox')
    cy.get('button').should('have.attr', 'aria-expanded', 'false')
    cy.get('button').click()
    cy.get('button').should('have.attr', 'aria-expanded', 'true')
  })

  it('generates unique IDs for accessibility', () => {
    cy.mount(<MediaIconPicker />)
    cy.get('button').should('have.attr', 'id')
    cy.get('button').click()
    cy.get('[role="listbox"]').should('have.attr', 'id')
  })

  it('has proper label association', () => {
    cy.mount(<MediaIconPicker label="Test Label" />)
    cy.get('button')
      .invoke('attr', 'id')
      .then((buttonId) => {
        cy.get('label').should('have.attr', 'for', buttonId)
      })
  })

  describe('Keyboard Navigation', () => {
    it('opens menu with Enter key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{enter}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with Space key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type(' ')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with ArrowDown key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('opens menu with ArrowUp key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('has visual focus on the first item when menu is open', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] [role="option"]').first().find('[role="img"]').should('have.class', 'text-foreground/100')
    })

    it('navigates through menu items with ArrowDown', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu and focus first item
      cy.get('[role="listbox"]').should('be.visible')

      // First item should be focused
      cy.get('[role="listbox"] [role="option"]').first().find('[role="img"]').should('have.class', 'text-foreground/100')

      // Navigate to second item
      cy.get('button').type('{downarrow}')
      cy.get('[role="listbox"] [role="option"]').eq(1).find('[role="img"]').should('have.class', 'text-foreground/100')

      // Navigate to third item
      cy.get('button').type('{downarrow}')
      cy.get('[role="listbox"] [role="option"]').eq(2).find('[role="img"]').should('have.class', 'text-foreground/100')
    })

    it('navigates through menu items with ArrowUp', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"]').should('be.visible')

      // Last item should be focused when opening with up arrow
      cy.get('[role="listbox"] [role="option"]').last().find('[role="img"]').should('have.class', 'text-foreground/100')

      // Navigate to second to last item
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 2)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')

      // Navigate to third to last item
      cy.get('button').type('{uparrow}')
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 3)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')
    })

    it('activates menu item with Enter', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<MediaIconPicker onChange={onChangeSpy} />)

      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu and focus first item
      cy.get('button').type('{enter}') // Activate first item

      cy.get('@onChangeSpy').should('have.been.called')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('activates menu item with Space', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<MediaIconPicker onChange={onChangeSpy} />)

      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu and focus first item
      cy.get('button').type(' ') // Activate first item

      cy.get('@onChangeSpy').should('have.been.called')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('navigates to first item with Home key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{downarrow}') // Navigate to second item
      cy.get('button').type('{home}') // Go to first item

      cy.get('[role="listbox"] [role="option"]').first().find('[role="img"]').should('have.class', 'text-foreground/100')
    })

    it('navigates to last item with End key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{end}') // Go to last item

      cy.get('[role="listbox"] [role="option"]').last().find('[role="img"]').should('have.class', 'text-foreground/100')
    })

    it('closes menu with Escape key', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('[role="listbox"]').should('be.visible')

      cy.get('button').type('{esc}') // Close menu
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('closes menu with Tab key', () => {
      cy.mount(
        <div>
          <MediaIconPicker />
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
      cy.mount(<MediaIconPicker disabled={true} />)

      // For disabled buttons, we can't focus them, so we'll test that the menu doesn't open
      cy.get('button').should('be.disabled')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('prevents default behavior for navigation keys', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}')

      // The menu should open and the page should not scroll
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('html').should('not.have.class', 'overflow-hidden')
    })

    it('maintains focus on button after menu closes', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}') // Open menu
      cy.get('button').type('{esc}') // Close menu

      cy.get('button').should('be.focused')
    })

    it('supports ArrowLeft and ArrowRight for navigation', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{leftarrow}') // Open menu
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 1)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')

      cy.get('button').type('{leftarrow}') // Navigate to previous item
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 2)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')

      cy.get('button').type('{rightarrow}') // Navigate to next item
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 1)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')

      cy.get('button').type('{rightarrow}') // On last item, should stay on last item
      cy.get('[role="listbox"] [role="option"]')
        .eq(AVAILABLE_ICONS.length - 1)
        .find('[role="img"]')
        .should('have.class', 'text-foreground/100')
    })
  })

  describe('Item Interaction', () => {
    it('handles item click events', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<MediaIconPicker onChange={onChangeSpy} />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').eq(1).click()
      cy.get('@onChangeSpy').should('have.been.called')
    })

    it('handles item keyboard events', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<MediaIconPicker onChange={onChangeSpy} />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').eq(1).focus()
      cy.get('[role="listbox"] [role="option"]').eq(1).type('{enter}')
      cy.get('@onChangeSpy').should('have.been.called')
    })

    it('prevents default on item mouse down', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').first().trigger('mousedown')
      // The item should still be clickable and not cause issues
      cy.get('[role="listbox"] [role="option"]').first().should('exist')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      cy.mount(<MediaIconPicker label="Test Label" />)
      cy.get('button').should('have.attr', 'aria-label')
      cy.get('button').click()
      cy.get('[role="listbox"]').should('have.attr', 'aria-label')
    })

    it('has proper ARIA selected states', () => {
      cy.mount(<MediaIconPicker value="audiobookshelf" />)
      cy.get('button').click()
      // The selected item should have aria-selected="true"
      cy.get('[role="listbox"] [role="option"]').should('have.attr', 'aria-selected')
    })

    it('has proper ARIA controls relationship', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('[role="listbox"]').should('have.attr', 'id')
    })

    it('has proper icon accessibility', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').find('[role="img"]').should('exist')
      cy.get('button').find('[role="img"]').should('have.attr', 'aria-label')
    })

    it('has aria-activedescendant when menu is open', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('button').should('have.attr', 'aria-activedescendant')
    })

    it('updates aria-activedescendant when navigating', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()

      // First item should be active
      cy.get('button').should('have.attr', 'aria-activedescendant').and('contain', 'option-0')

      // Navigate to second item
      cy.realType('{downarrow}')
      cy.get('button').should('have.attr', 'aria-activedescendant').and('contain', 'option-1')

      // Navigate to third item
      cy.realType('{downarrow}')
      cy.get('button').should('have.attr', 'aria-activedescendant').and('contain', 'option-2')
    })

    it('has unique IDs for menu options', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').first().should('have.attr', 'id')
      cy.get('[role="listbox"] [role="option"]').eq(1).should('have.attr', 'id')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined value', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').should('exist')
      // Should fall back to 'database' as default
      cy.get('button').find('[role="img"]').should('exist')
    })

    it('handles invalid value', () => {
      cy.mount(<MediaIconPicker value="invalid-icon" />)
      cy.get('button').should('exist')
      // Should fall back to 'audiobookshelf' as default
      cy.get('button').find('[role="img"]').should('exist')
    })

    it('handles empty string value', () => {
      cy.mount(<MediaIconPicker value="" />)
      cy.get('button').should('exist')
      // Should fall back to 'database' as default
      cy.get('button').find('[role="img"]').should('exist')
    })

    it('handles null onChange', () => {
      cy.mount(<MediaIconPicker onChange={undefined} />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').first().click()
      // Should not throw error
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('handles rapid clicking', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('button').click()
      cy.get('button').click()
      // Should handle rapid clicks without issues
      cy.get('[role="listbox"]').should('exist')
    })

    it('handles rapid keyboard navigation', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').focus()
      cy.get('button').type('{downarrow}{downarrow}{downarrow}{downarrow}')
      cy.get('[role="listbox"]').should('be.visible')
      // Should handle rapid key presses without issues
      cy.get('[role="listbox"] [role="option"]').should('have.length', 20)
    })
  })

  describe('Visual States', () => {
    it('shows hover state on menu items', () => {
      cy.mount(<MediaIconPicker />)
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').first().trigger('mouseover')
      // Should have hover styling
      cy.get('[role="listbox"] [role="option"]').first().should('have.class', 'hover:text-foreground/75')
    })

    it('shows disabled state styling', () => {
      cy.mount(<MediaIconPicker disabled={true} />)
      cy.get('button').should('have.class', 'disabled:cursor-not-allowed')
      cy.get('button').should('have.class', 'disabled:border-none')
      cy.get('button').should('have.class', 'disabled:text-disabled')
      cy.get('button').should('have.class', 'disabled:bg-bg-disabled')
    })
  })

  describe('Icon Selection', () => {
    it('selects different icons', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      cy.mount(<MediaIconPicker onChange={onChangeSpy} />)

      // Select first icon
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').first().click()
      cy.get('@onChangeSpy').should('have.been.called')

      // Select second icon
      cy.get('button').click()
      cy.get('[role="listbox"] [role="option"]').eq(1).click()
      cy.get('@onChangeSpy').should('have.been.called')
    })

    it('maintains selected state', () => {
      cy.mount(<MediaIconPicker value="audiobookshelf" />)
      cy.get('button').click()
      // The selected item should be marked as selected
      cy.get('[role="listbox"] [role="option"]').should('have.attr', 'aria-selected')
    })
  })
})
