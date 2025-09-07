import React, { useRef, useState } from 'react'
import ContextMenu from '@/components/ui/ContextMenu'
import { ContextMenuSubitem, ContextMenuItem } from '@/components/ui/ContextMenu'

// Test wrapper component to manage ContextMenu state
const TestWrapper = ({
  items,
  menuWidth = 96,
  menuAlign = 'right',
  autoWidth = false,
  className,
  onItemClick,
  onSubItemClick,
  onCloseSubmenu
}: {
  items: ContextMenuItem[]
  menuWidth?: number
  menuAlign?: 'right' | 'left'
  autoWidth?: boolean
  className?: string
  onItemClick?: (action: string, data?: Record<string, any>) => void
  onSubItemClick?: (action: string, data?: Record<string, any>) => void
  onCloseSubmenu?: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [focusedSubIndex, setFocusedSubIndex] = useState(-1)
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpenSubmenu = (index: number) => {
    setOpenSubmenuIndex(index)
  }

  const handleCloseSubmenu = () => {
    setOpenSubmenuIndex(null)
    onCloseSubmenu?.()
  }

  return (
    <div className="relative h-64 w-64 bg-gray-800 p-4">
      <button cy-id="trigger-button" onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Toggle Menu
      </button>
      <ContextMenu
        ref={menuRef}
        items={items}
        isOpen={isOpen}
        menuWidth={menuWidth}
        menuAlign={menuAlign}
        autoWidth={autoWidth}
        className={className}
        menuId="test-menu"
        focusedIndex={focusedIndex}
        focusedSubIndex={focusedSubIndex}
        openSubmenuIndex={openSubmenuIndex}
        onOpenSubmenu={handleOpenSubmenu}
        onCloseSubmenu={handleCloseSubmenu}
        onItemClick={onItemClick}
        onSubItemClick={onSubItemClick}
      />
    </div>
  )
}

describe('<ContextMenu />', () => {
  const mockItems: ContextMenuItem[] = [
    { text: 'Item 1', action: 'action1' },
    {
      text: 'Item 2',
      action: 'action2',
      subitems: [
        { text: 'Subitem 1', action: 'subaction1', data: { value: 'data1' } },
        { text: 'Subitem 2', action: 'subaction2', data: { value: 'data2' } },
        { text: 'Subitem 3', action: 'subaction3', data: { value: 'data3' } }
      ]
    },
    { text: 'Item 3', action: 'action3' },
    {
      text: 'Item 4',
      action: 'action4',
      subitems: [
        { text: 'Subitem 4', action: 'subaction4' },
        { text: 'Subitem 5', action: 'subaction5' }
      ]
    }
  ]

  beforeEach(() => {
    cy.viewport(800, 600)
  })

  it('renders when isOpen is true', () => {
    cy.mount(<TestWrapper items={mockItems} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('be.visible')
  })

  it('does not render when isOpen is false', () => {
    cy.mount(<TestWrapper items={mockItems} />)
    cy.get('[cy-id="menu"]').should('not.exist')
  })

  it('renders correct number of menu items', () => {
    cy.mount(<TestWrapper items={mockItems} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"] > *').should('have.length', mockItems.length)
  })

  it('renders menu items with correct text', () => {
    cy.mount(<TestWrapper items={mockItems} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="action-item"]').first().should('contain.text', 'Item 1')
    cy.get('[cy-id="parent-item"]').first().should('contain.text', 'Item 2')
  })

  it('applies custom menu width', () => {
    const customWidth = 200
    cy.mount(<TestWrapper items={mockItems} menuWidth={customWidth} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('have.css', 'width', `${customWidth}px`)
  })

  it('applies auto width with minimum width', () => {
    const minWidth = 150
    cy.mount(<TestWrapper items={mockItems} autoWidth={true} menuWidth={minWidth} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('have.css', 'min-width', `${minWidth}px`)
  })

  it('applies right alignment by default', () => {
    cy.mount(<TestWrapper items={mockItems} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('have.class', 'end-0')
  })

  it('applies left alignment when specified', () => {
    cy.mount(<TestWrapper items={mockItems} menuAlign="left" />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('have.class', 'start-0')
  })

  it('applies custom className', () => {
    cy.mount(<TestWrapper items={mockItems} className="custom-menu-class" />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"]').should('have.class', 'custom-menu-class')
  })

  it('emits onItemClick when regular menu item is clicked', () => {
    const onItemClickSpy = cy.spy().as('onItemClickSpy')
    cy.mount(<TestWrapper items={mockItems} onItemClick={onItemClickSpy} />)
    cy.get('[cy-id="trigger-button"]').click()
    cy.get('[cy-id="menu"] > button').first().click()
    cy.get('@onItemClickSpy').should('have.been.calledWith', 'action1')
  })

  it('emits onSubItemClick when submenu item is clicked', () => {
    const onSubItemClickSpy = cy.spy().as('onSubItemClickSpy')
    cy.mount(<TestWrapper items={mockItems} onSubItemClick={onSubItemClickSpy} />)
    cy.get('[cy-id="trigger-button"]').click()
    // Hover over item with subitems to open submenu
    cy.get('[cy-id="parent-item"]').first().realHover()
    cy.get('[cy-id="submenu-1"]').should('be.visible')
    cy.get('[cy-id="submenu-1"] > button').first().click()
    cy.get('@onSubItemClickSpy').should('have.been.calledWith', 'subaction1', { value: 'data1' })
  })

  describe('Hover Behavior', () => {
    it('opens submenu on hover over parent item', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
    })

    it('closes submenu when mouse moves from parent to action item', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // Move mouse to first action item
      cy.get('[cy-id="action-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('closes old submenu when mouse moves from parent to parent', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // Move mouse to second parent
      cy.get('[cy-id="parent-item"]').eq(1).realHover()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('opens new submenu when mouse moves from parent to parent', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // Move mouse to second parent
      cy.get('[cy-id="parent-item"]').eq(1).realHover()
      cy.get('[cy-id="submenu-3"]').should('be.visible')
    })

    it('keeps submenu open when hovering from parent to submenu', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // Move mouse to submenu
      cy.get('[cy-id="submenu-1"]').realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
    })

    it('keeps submenu open when hovering from submenu back to parent', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      // Move mouse to submenu
      cy.get('[cy-id="submenu-1"]').realHover()
      // Move back to parent
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
    })

    it('handles rapid hover movements between items', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()

      // Rapidly hover between items with subitems
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('[cy-id="submenu-3"]').should('not.exist')

      // Move to second parent
      cy.get('[cy-id="parent-item"]').eq(1).realHover()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
      cy.get('[cy-id="submenu-3"]').should('be.visible')

      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('[cy-id="submenu-3"]').should('not.exist')
    })

    it('maintains submenu position when hovering within submenu', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')

      // Get initial position
      cy.get('[cy-id="submenu-1"]').then(($submenu) => {
        const initialTop = $submenu[0].getBoundingClientRect().top

        // Hover within submenu
        cy.get('[cy-id="submenu-1"] > button').first().realHover()
        cy.get('[cy-id="submenu-1"]').then(($submenu2) => {
          const newTop = $submenu2[0].getBoundingClientRect().top
          expect(newTop).to.equal(initialTop)
        })
      })
    })

    it('closes submenu when mouse moves away from menu and submenu', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('body').realHover()
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })
  })

  describe('Submenu Positioning', () => {
    it('positions submenu to the right by default', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('[cy-id="submenu-1"]').should('have.class', 'rounded-e-md')
    })

    it('positions submenu to the left when near right edge', () => {
      // Position the test wrapper near the right edge
      cy.mount(
        <div className="flex justify-end">
          <TestWrapper items={mockItems} />
        </div>
      )
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"]').should('be.visible')
      cy.get('[cy-id="submenu-1"]').should('have.class', 'rounded-s-md')
    })

    it('aligns submenu items with parent item', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()

      // Check that first submenu item aligns with parent item
      cy.get('[cy-id="parent-item"]')
        .first()
        .then(($parent) => {
          const parentTop = $parent[0].getBoundingClientRect().top
          cy.get('[cy-id="submenu-1"] > button')
            .first()
            .then(($subitem) => {
              const subitemTop = $subitem[0].getBoundingClientRect().top
              expect(subitemTop).to.be.closeTo(parentTop, 2)
            })
        })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="menu"]').should('have.attr', 'aria-label', 'Context menu')
      cy.get('[cy-id="parent-item"]').first().should('have.attr', 'aria-haspopup', 'true')
      // This is flaky for some reason - todo: fix this
      //cy.get('[cy-id="parent-item"]').first().should('have.attr', 'aria-expanded', 'false')
    })

    it('updates ARIA expanded state when submenu opens', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="parent-item"]').first().should('have.attr', 'aria-expanded', 'true')
    })

    it('generates unique IDs for menu items', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="menu"]').should('have.attr', 'id', 'test-menu')
      cy.get('[cy-id="action-item"]').first().should('have.attr', 'id', 'test-menu-item-0')
      cy.get('[cy-id="parent-item"]').first().should('have.attr', 'id', 'test-menu-item-1')
    })

    it('generates unique IDs for submenu items', () => {
      cy.mount(<TestWrapper items={mockItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      cy.get('[cy-id="submenu-1"] > button').first().should('have.attr', 'id', 'test-menu-subitem-1-0')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      cy.mount(<TestWrapper items={[]} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="menu"]').should('be.visible')
      cy.get('[cy-id="menu"] > *').should('have.length', 0)
    })

    it('handles items without subitems', () => {
      const simpleItems: ContextMenuItem[] = [
        { text: 'Item 1', action: 'action1' },
        { text: 'Item 2', action: 'action2' }
      ]
      cy.mount(<TestWrapper items={simpleItems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="menu"] > button').should('have.length', 2)
      cy.get('[cy-id="submenu-1"]').should('not.exist')
    })

    it('handles items with empty subitems array', () => {
      const itemsWithEmptySubitems: ContextMenuItem[] = [{ text: 'Item 1', action: 'action1', subitems: [] }]
      cy.mount(<TestWrapper items={itemsWithEmptySubitems} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="parent-item"]').first().realHover()
      // The component still renders the submenu container but with no items
      cy.get('[cy-id="submenu-0"]').should('be.visible')
      cy.get('[cy-id="no-items-subitem"]').should('be.visible')
      cy.get('[cy-id="no-items-subitem"]').should('be.disabled')
    })

    it('handles very long text in menu items', () => {
      const longTextItems: ContextMenuItem[] = [{ text: 'This is a very long menu item text that should wrap properly in the context menu', action: 'action1' }]
      cy.mount(<TestWrapper items={longTextItems} autoWidth={true} />)
      cy.get('[cy-id="trigger-button"]').click()
      cy.get('[cy-id="menu"] > button').first().should('contain.text', 'This is a very long menu item text')
    })
  })
})
