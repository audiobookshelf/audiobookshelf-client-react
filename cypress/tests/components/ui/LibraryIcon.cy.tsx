import LibraryIcon from '@/components/ui/LibraryIcon'
import { AVAILABLE_ICONS } from '@/lib/absicons'

describe('LibraryIcon', () => {
  beforeEach(() => {
    cy.mount(<LibraryIcon />)
  })

  it('renders with default props', () => {
    cy.get('&library-icon').should('be.visible')
    cy.get('&library-icon-span').should('have.class', 'abs-icons')
    cy.get('&library-icon-span').should('have.class', 'icon-audiobookshelf')
  })

  it('applies custom icon', () => {
    cy.mount(<LibraryIcon icon="books-1" />)
    cy.get('&library-icon-span').should('have.class', 'icon-books-1')
  })

  it('falls back to audiobookshelf for invalid icon', () => {
    cy.mount(<LibraryIcon icon="invalid-icon" />)
    cy.get('&library-icon-span').should('have.class', 'icon-audiobookshelf')
  })

  it('applies custom size', () => {
    cy.mount(<LibraryIcon size={6} />)
    cy.get('&library-icon').should('have.class', 'h-6')
    cy.get('&library-icon').should('have.class', 'w-6')
    cy.get('&library-icon').should('have.class', 'min-w-6')
  })

  it('applies custom font size', () => {
    cy.mount(<LibraryIcon fontSize="text-3xl" />)
    cy.get('&library-icon').should('have.class', 'text-3xl')
  })

  it('applies custom className', () => {
    cy.mount(<LibraryIcon className="custom-class" />)
    cy.get('&library-icon').should('have.class', 'custom-class')
  })

  describe('Accessibility', () => {
    it('has proper role and aria-label by default', () => {
      cy.mount(<LibraryIcon />)
      cy.get('&library-icon').should('have.attr', 'aria-hidden', 'true')
      cy.get('&library-icon').should('not.have.attr', 'role')
      cy.get('&library-icon').should('not.have.attr', 'aria-label')
    })

    it('supports custom aria-label', () => {
      cy.mount(<LibraryIcon icon="books-1" decorative={false} ariaLabel="Library books icon" />)
      cy.get('&library-icon').should('have.attr', 'aria-label', 'Library books icon')
    })

    it('handles non-decorative icons correctly', () => {
      cy.mount(<LibraryIcon icon="books-1" decorative={false} />)
      cy.get('&library-icon').should('have.attr', 'aria-hidden', 'false')
      cy.get('&library-icon').should('have.attr', 'role', 'img')
      cy.get('&library-icon').should('have.attr', 'aria-label', 'Books 1 icon')
    })

    it('generates readable aria-label from icon name', () => {
      cy.mount(<LibraryIcon icon="microphone-1" decorative={false} />)
      cy.get('&library-icon').should('have.attr', 'aria-label', 'Microphone 1 icon')
    })

    it('handles complex icon names correctly', () => {
      cy.mount(<LibraryIcon icon="file-picture" decorative={false} />)
      cy.get('&library-icon').should('have.attr', 'aria-label', 'File Picture icon')
    })

    it('works with all available icons', () => {
      AVAILABLE_ICONS.forEach((icon) => {
        cy.mount(<LibraryIcon icon={icon} decorative={false} />)
        cy.get('&library-icon-span').should('have.class', `icon-${icon}`)
        cy.get('&library-icon').should('have.attr', 'aria-label')
      })
    })
  })

  describe('Visual styling', () => {
    it('has proper flex layout', () => {
      cy.get('&library-icon').should('have.class', 'flex')
      cy.get('&library-icon').should('have.class', 'items-center')
      cy.get('&library-icon').should('have.class', 'justify-center')
    })

    it('has correct default size classes', () => {
      cy.get('&library-icon').should('have.class', 'h-5')
      cy.get('&library-icon').should('have.class', 'w-5')
      cy.get('&library-icon').should('have.class', 'min-w-5')
    })

    it('has correct default font size', () => {
      cy.get('&library-icon').should('have.class', 'text-lg')
    })
  })
})
