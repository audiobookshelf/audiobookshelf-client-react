import LibrariesDropdown from '@/app/(main)/LibrariesDropdown'
import { Library } from '@/types/api'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import * as navigation from 'next/navigation'
import { ReactNode } from 'react'

const mockLibraries: Library[] = [
  {
    id: 'lib-books',
    name: 'Audiobooks',
    displayOrder: 1,
    icon: 'books-1',
    mediaType: 'book',
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'lib-podcasts',
    name: 'Podcasts',
    displayOrder: 2,
    icon: 'podcast',
    mediaType: 'podcast',
    createdAt: 0,
    updatedAt: 0
  }
]

function mountLibrariesDropdown(ui: ReactNode) {
  const router = {
    back: cy.stub(),
    forward: cy.stub(),
    refresh: cy.stub(),
    push: cy.stub().as('routerPush'),
    replace: cy.stub(),
    prefetch: cy.stub()
  } as AppRouterInstance

  const searchParams = new URLSearchParams()

  cy.stub(navigation, 'useRouter').callsFake(() => router)
  cy.stub(navigation, 'usePathname').callsFake(() => '/library/lib-books/items')
  cy.stub(navigation, 'useSearchParams').callsFake(() => searchParams)

  cy.mount(<AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>)
}

describe('<LibrariesDropdown />', () => {
  it('renders selected library icon and name in the button', () => {
    mountLibrariesDropdown(<LibrariesDropdown libraries={mockLibraries} currentLibraryId="lib-books" />)
    cy.get('button').should('contain.text', 'Audiobooks')
    cy.get('button [cy-id="library-icon-span"]').should('have.class', 'icon-books-1')
  })

  it('renders other libraries in the menu list but not the selected library', () => {
    mountLibrariesDropdown(<LibrariesDropdown libraries={mockLibraries} currentLibraryId="lib-books" />)
    cy.get('button').click()
    cy.get('[role="listbox"] > li').should('have.length', 1)
    cy.get('[role="listbox"] > li').eq(0).find('[cy-id="library-icon-span"]').should('have.class', 'icon-podcast')
    cy.get('[role="listbox"] > li').eq(0).should('contain.text', 'Podcasts')
    cy.get('[role="listbox"]').should('not.contain.text', 'Audiobooks')
  })

  it('shows the selected podcast library icon when that library is active', () => {
    mountLibrariesDropdown(<LibrariesDropdown libraries={mockLibraries} currentLibraryId="lib-podcasts" />)
    cy.get('button').should('contain.text', 'Podcasts')
    cy.get('button [cy-id="library-icon-span"]').should('have.class', 'icon-podcast')
  })

  it('sizes the button to the longest library name when a shorter library is selected', () => {
    cy.viewport(1024, 768)

    const libraries: Library[] = [
      {
        id: 'lib-short',
        name: 'Test',
        displayOrder: 1,
        icon: 'database',
        mediaType: 'book',
        createdAt: 0,
        updatedAt: 0
      },
      {
        id: 'lib-long',
        name: 'Audiobookshelf Collection',
        displayOrder: 2,
        icon: 'books-1',
        mediaType: 'book',
        createdAt: 0,
        updatedAt: 0
      }
    ]

    mountLibrariesDropdown(<LibrariesDropdown libraries={libraries} currentLibraryId="lib-short" />)
    cy.get('button').click()
    cy.get('[role="listbox"] > li')
      .eq(0)
      .invoke('outerWidth')
      .then((menuItemWidth) => {
        cy.get('[cy-id="control-wrapper"]').invoke('outerWidth').should('be.gte', menuItemWidth)
      })
    cy.get('[role="listbox"] > li').eq(0).should('contain.text', 'Audiobookshelf Collection')
  })
})
