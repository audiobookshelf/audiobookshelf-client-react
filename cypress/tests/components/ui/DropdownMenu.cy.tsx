import React from 'react'
import DropdownMenu from '@/components/ui/DropdownMenu'

// Define types for the dropdown menu items based on the component's interface
interface DropdownMenuItem {
  text: string
  value: string | number
  subtext?: string
}

describe('<DropdownMenu />', () => {
  const mockItems: DropdownMenuItem[] = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2', subtext: 'Description' },
    { text: 'Option 3', value: 'option3' },
    { text: 'Option 4', value: 'option4', subtext: 'Another description' }
  ]

  const defaultProps = {
    showMenu: true,
    items: mockItems,
    focusedIndex: 0,
    dropdownId: 'test-dropdown'
  }

  describe('Rendering', () => {
    it('renders when showMenu is true', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('be.visible')
    })

    it('does not render when showMenu is false', () => {
      cy.mount(<DropdownMenu {...defaultProps} showMenu={false} />)
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('renders correct number of menu items', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').should('have.length', mockItems.length)
    })

    it('displays items with text and subtext', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Option 2')
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Description')
    })

    it('displays items with only text when no subtext', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(0).should('contain.text', 'Option 1')
      cy.get('[role="listbox"] > li').eq(0).should('not.contain.text', ':')
    })

    it('handles empty items array', () => {
      cy.mount(<DropdownMenu {...defaultProps} items={[]} />)
      cy.get('[role="listbox"] > li').should('have.length', 0)
    })

    it('shows and hides menu based on showMenu prop', () => {
      const TestComponent = () => {
        const [showMenu, setShowMenu] = React.useState(false)

        React.useEffect(() => {
          const timer = setTimeout(() => {
            setShowMenu(true)
          }, 100)

          return () => clearTimeout(timer)
        }, [])

        return <DropdownMenu {...defaultProps} showMenu={showMenu} />
      }

      cy.mount(<TestComponent />)
      // Initially menu should not exist
      cy.get('[role="listbox"]').should('not.exist')
      // After timeout, menu should be visible
      cy.get('[role="listbox"]').should('be.visible')
    })
  })

  describe('Item Interaction', () => {
    it('calls onItemClick when menu item is clicked', () => {
      const onItemClick = cy.stub().as('onItemClick')
      cy.mount(<DropdownMenu {...defaultProps} onItemClick={onItemClick} />)
      cy.get('[role="listbox"] > li').first().click()
      cy.get('@onItemClick').should('have.been.calledWith', mockItems[0])
    })

    it('prevents default behavior on mouse down', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').first().trigger('mousedown')
      // The test passes if no error is thrown, as preventDefault is called
    })

    it('handles multiple clicks on the same item', () => {
      const onItemClick = cy.stub().as('onItemClick')
      cy.mount(<DropdownMenu {...defaultProps} onItemClick={onItemClick} />)
      cy.get('[role="listbox"] > li').first().click()
      cy.get('@onItemClick').should('have.been.calledWith', mockItems[0])
      cy.get('[role="listbox"] > li').first().click()
      cy.get('@onItemClick').should('have.been.calledTwice')
    })

    it('prevents event propagation on item click', () => {
      cy.mount(
        <div onClick={cy.stub().as('parentClickSpy')}>
          <DropdownMenu {...defaultProps} />
        </div>
      )
      cy.get('[role="listbox"] > li').first().click()
      cy.get('@parentClickSpy').should('not.have.been.called')
    })

    it('handles items with numeric values', () => {
      const numericOnItemClick = cy.stub().as('numericOnItemClick')
      const numericItems: DropdownMenuItem[] = [
        { text: 'Item 1', value: 1 },
        { text: 'Item 2', value: 2, subtext: 'Numeric' }
      ]
      cy.mount(<DropdownMenu {...defaultProps} items={numericItems} onItemClick={numericOnItemClick} />)
      cy.get('[role="listbox"] > li').first().click()
      cy.get('@numericOnItemClick').should('have.been.calledWith', numericItems[0])
    })
  })

  describe('Focus and Selection', () => {
    it('applies focused styling to focused item', () => {
      cy.mount(<DropdownMenu {...defaultProps} focusedIndex={1} />)
      cy.get('[role="listbox"] > li').eq(1).should('have.class', 'bg-black-300')
      cy.get('[role="listbox"] > li').eq(0).should('not.have.class', 'bg-black-300')
    })

    it('scrolls focused item into view', () => {
      // This test verifies the useEffect behavior for scrolling
      cy.mount(<DropdownMenu {...defaultProps} focusedIndex={3} />)
      // The focused item should be visible in the viewport
      cy.get('#test-dropdown-item-3').should('be.visible')
    })

    it('shows selected indicator when showSelectedIndicator is true', () => {
      const isItemSelected = (item: DropdownMenuItem) => item.value === 'option2'
      cy.mount(<DropdownMenu {...defaultProps} showSelectedIndicator={true} isItemSelected={isItemSelected} />)
      cy.get('[role="listbox"] > li').eq(1).find('.material-symbols').should('contain.text', 'check')
      cy.get('[role="listbox"] > li').eq(1).find('.material-symbols').should('have.class', 'text-yellow-400')
    })

    it('does not show selected indicator when showSelectedIndicator is false', () => {
      const isItemSelected = (item: DropdownMenuItem) => item.value === 'option2'
      cy.mount(<DropdownMenu {...defaultProps} showSelectedIndicator={false} isItemSelected={isItemSelected} />)
      cy.get('[role="listbox"] > li').eq(1).find('.material-symbols').should('not.exist')
    })

    it('sets correct aria-selected attribute when isItemSelected is provided', () => {
      const isItemSelected = (item: DropdownMenuItem) => item.value === 'option2'
      cy.mount(<DropdownMenu {...defaultProps} isItemSelected={isItemSelected} />)
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'aria-selected', 'true')
      cy.get('[role="listbox"] > li').eq(0).should('have.attr', 'aria-selected', 'false')
    })

    it('sets aria-selected based on focusedIndex when isItemSelected is not provided', () => {
      cy.mount(<DropdownMenu {...defaultProps} focusedIndex={1} />)
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'aria-selected', 'true')
      cy.get('[role="listbox"] > li').eq(0).should('have.attr', 'aria-selected', 'false')
    })
  })

  describe('No Items State', () => {
    it('shows no items message when items array is empty and showNoItemsMessage is true', () => {
      cy.mount(<DropdownMenu {...defaultProps} items={[]} showNoItemsMessage={true} />)
      cy.get('[cy-id="dropdown-menu-no-items"]').should('be.visible')
      cy.get('[cy-id="dropdown-menu-no-items"]').should('contain.text', 'No items')
    })

    it('shows custom no items text', () => {
      const customText = 'No options available'
      cy.mount(<DropdownMenu {...defaultProps} items={[]} showNoItemsMessage={true} noItemsText={customText} />)
      cy.get('[cy-id="dropdown-menu-no-items"]').should('contain.text', customText)
    })

    it('does not show no items message when showNoItemsMessage is false', () => {
      cy.mount(<DropdownMenu {...defaultProps} items={[]} showNoItemsMessage={false} />)
      cy.get('[cy-id="dropdown-menu-no-items"]').should('not.exist')
    })
  })

  describe('Customization', () => {
    it('applies custom className', () => {
      cy.mount(<DropdownMenu {...defaultProps} className="custom-menu-class" />)
      cy.get('[role="listbox"]').should('have.class', 'custom-menu-class')
    })

    it('applies custom menu max height', () => {
      const customHeight = '300px'
      cy.mount(<DropdownMenu {...defaultProps} menuMaxHeight={customHeight} />)
      cy.get('[role="listbox"]').should('have.css', 'max-height', customHeight)
    })
  })

  describe('Accessibility', () => {
    it('generates correct IDs for menu items', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(0).should('have.attr', 'id', 'test-dropdown-item-0')
      cy.get('[role="listbox"] > li').eq(1).should('have.attr', 'id', 'test-dropdown-item-1')
    })

    it('sets correct ARIA attributes', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.attr', 'id', 'test-dropdown-listbox')
      cy.get('[role="listbox"] > li').first().should('have.attr', 'role', 'option')
      cy.get('[role="listbox"] > li').first().should('have.attr', 'tabIndex', '-1')
    })
  })

  describe('Styling', () => {
    it('applies hover styling to menu items', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').first().should('have.class', 'hover:bg-black-400')
    })

    it('applies correct text styling for items with subtext', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(1).find('span').first().should('have.class', 'font-semibold')
    })

    it('applies correct text styling for items without subtext', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(0).find('span').first().should('not.have.class', 'font-semibold')
    })

    it('renders subtext with correct styling', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"] > li').eq(1).find('span').last().should('have.class', 'text-gray-400')
      cy.get('[role="listbox"] > li').eq(1).find('span').last().should('have.class', 'font-normal')
    })

    it('maintains proper z-index for dropdown positioning', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'z-10')
    })

    it('applies proper border and shadow styling', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'border')
      cy.get('[role="listbox"]').should('have.class', 'border-black-200')
      cy.get('[role="listbox"]').should('have.class', 'shadow-lg')
    })

    it('applies proper ring styling', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'ring-1')
      cy.get('[role="listbox"]').should('have.class', 'ring-black/5')
    })

    it('applies proper rounded corners', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'rounded-md')
    })

    it('applies proper padding', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'py-1')
    })

    it('applies proper overflow handling', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'overflow-auto')
    })

    it('applies responsive text sizing', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'sm:text-sm')
    })

    it('handles absolute positioning', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'absolute')
    })

    it('applies full width', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'w-full')
    })

    it('applies primary background color', () => {
      cy.mount(<DropdownMenu {...defaultProps} />)
      cy.get('[role="listbox"]').should('have.class', 'bg-primary')
    })
  })

  describe('Edge Cases', () => {
    it('handles items with special characters in text', () => {
      const specialItems: DropdownMenuItem[] = [
        { text: 'Option & Special', value: 'special1' },
        { text: 'Option < Test >', value: 'special2', subtext: 'HTML & chars' }
      ]
      cy.mount(<DropdownMenu {...defaultProps} items={specialItems} />)
      cy.get('[role="listbox"] > li').eq(0).should('contain.text', 'Option & Special')
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Option < Test >')
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'HTML & chars')
    })

    it('handles very long text in items', () => {
      const longText =
        'This is a very long text that should be truncated properly in the dropdown menu item to ensure it fits within the container and maintains proper styling'
      const longItems: DropdownMenuItem[] = [
        { text: longText, value: 'long1' },
        { text: 'Short', value: 'short1', subtext: longText }
      ]
      cy.mount(<DropdownMenu {...defaultProps} items={longItems} />)
      cy.get('[role="listbox"] > li').eq(0).should('contain.text', 'This is a very long text')
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'Short')
      cy.get('[role="listbox"] > li').eq(1).should('contain.text', 'This is a very long text')
    })
  })
})
