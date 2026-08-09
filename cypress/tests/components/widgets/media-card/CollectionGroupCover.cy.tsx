import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { CardSizeProvider } from '@/contexts/CardSizeContext'
import type { LibraryItem } from '@/types/api'

const bookWithCover = {
  id: 'book-1',
  updatedAt: 1,
  media: { coverPath: '/cover.jpg' }
} as LibraryItem

const secondBookWithCover = {
  id: 'book-2',
  updatedAt: 2,
  media: { coverPath: '/second-cover.jpg' }
} as LibraryItem

function mockImageLoad(naturalWidth: number, naturalHeight: number) {
  cy.window().then((win) => {
    cy.stub(win, 'Image').callsFake(() => {
      const image = {
        naturalWidth,
        naturalHeight,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_src: string) {
          win.setTimeout(() => image.onload?.(), 0)
        }
      }

      return image as unknown as HTMLImageElement
    })
  })
}

function mockImageError() {
  cy.window().then((win) => {
    cy.stub(win, 'Image').callsFake(() => {
      const image = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_src: string) {
          win.setTimeout(() => image.onerror?.(), 0)
        }
      }

      return image as unknown as HTMLImageElement
    })
  })
}

function mountCollectionGroupCover(books: LibraryItem[]) {
  cy.mount(
    <CardSizeProvider>
      <CollectionGroupCover books={books} width={240} height={120} />
    </CardSizeProvider>
  )
}

describe('<CollectionGroupCover />', () => {
  it('preserves a non-standard cover aspect ratio with a cover background', () => {
    mockImageLoad(900, 675)
    mountCollectionGroupCover([bookWithCover])

    cy.get('.cover-bg').should('exist').parent().should('have.css', 'width', '240px')
    cy.get('img').should('have.class', 'object-contain').should('have.css', 'width', '160px').should('have.css', 'height', '120px')
  })

  it('uses a cover background when a square cover leaves space in a single-book layout', () => {
    mockImageLoad(400, 400)
    mountCollectionGroupCover([bookWithCover])

    cy.get('.cover-bg').should('exist')
    cy.get('img').should('have.class', 'object-contain').should('have.css', 'width', '120px').should('have.css', 'height', '120px')
  })

  it('preserves non-standard covers in both side-by-side cells', () => {
    mockImageLoad(900, 675)
    mountCollectionGroupCover([bookWithCover, secondBookWithCover])

    cy.get('.cover-bg').should('have.length', 2)
    cy.get('img')
      .should('have.length', 2)
      .each(($image) => {
        cy.wrap($image).should('have.class', 'object-contain').should('have.css', 'width', '120px').should('have.css', 'height', '90px')
      })
  })

  it('keeps covers matching their square cells in cover mode', () => {
    mockImageLoad(400, 400)
    mountCollectionGroupCover([bookWithCover, secondBookWithCover])

    cy.get('.cover-bg').should('not.exist')
    cy.get('img')
      .should('have.length', 2)
      .each(($image) => cy.wrap($image).should('have.class', 'object-cover'))
  })

  it('falls back to cover mode when image dimensions cannot be loaded', () => {
    mockImageError()
    mountCollectionGroupCover([bookWithCover])

    cy.get('.cover-bg').should('not.exist')
    cy.get('img').should('have.class', 'object-cover')
  })
})
