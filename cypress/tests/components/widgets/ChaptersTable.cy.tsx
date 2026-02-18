import ChaptersTable from '@/components/widgets/ChaptersTable'
import { BookLibraryItem, User } from '@/types/api'

// Inline mocks since fixtures are not found
const mockUser: User = {
  id: 'root',
  username: 'admin',
  type: 'root',
  token: 'test-token',
  permissions: {
    download: true,
    update: true,
    delete: true,
    upload: true,
    accessAllLibraries: true,
    accessAllTags: true,
    accessExplicitContent: true,
    createEreader: true,
    selectedTagsNotAccessible: false
  },
  mediaProgress: [],
  seriesHideFromContinueListening: [],
  bookmarks: [],
  isActive: true,
  isLocked: false,
  createdAt: 1234567890,
  librariesAccessible: [],
  itemTagsSelected: [],
  hasOpenIDLink: false
}

const mockLibraryItem: BookLibraryItem = {
  id: 'test-item-id',
  ino: '123',
  libraryId: 'test-library-id',
  folderId: 'test-folder-id',
  path: '/path/to/book',
  relPath: 'book',
  isFile: false,
  mtimeMs: 1234567890,
  ctimeMs: 1234567890,
  birthtimeMs: 1234567890,
  addedAt: 1234567890,
  updatedAt: 1234567890,
  lastScan: 1234567890,
  scanVersion: '1',
  isMissing: false,
  isInvalid: false,
  mediaType: 'book',
  media: {
    id: 'test-media-id',
    libraryItemId: 'test-item-id',
    metadata: {
      title: 'Test Book Title',
      authorName: 'Test Author',
      authors: [],
      narrators: [],
      series: [],
      genres: [],
      explicit: false
    },
    coverPath: '',
    tags: [],
    audioFiles: [],
    chapters: [],
    duration: 120, // 2 minutes
    size: 1000,
    tracks: [],
    ebookFile: undefined
  },
  libraryFiles: []
}

describe('ChaptersTable', () => {
  it('renders correctly', () => {
    // Ensure viewport is large enough to show all columns (Duration hides below md)
    cy.viewport(1024, 768)

    // Add chapters to the test item
    const libraryItem = { ...mockLibraryItem }
    libraryItem.media.chapters = [
      { id: 1, start: 0, end: 60, title: 'Chapter 1' },
      { id: 2, start: 60, end: 120, title: 'Chapter 2' }
    ]

    cy.mount(<ChaptersTable libraryItem={libraryItem} user={mockUser} expanded />)

    cy.get('table').should('exist')
    cy.contains('Chapter 1').should('be.visible')
    cy.contains('Chapter 2').should('be.visible')
    cy.contains('00:00').should('be.visible') // Start time
    cy.contains('01:00').should('be.visible') // Duration
  })

  it('hides columns based on viewport width', () => {
    const libraryItem = { ...mockLibraryItem }
    libraryItem.media.chapters = [{ id: 1, start: 0, end: 60, title: 'Chapter 1' }]

    cy.mount(<ChaptersTable libraryItem={libraryItem} user={mockUser} expanded />)

    // Mobile (xs)
    cy.viewport(375, 667)
    // Id and Duration should be hidden
    cy.contains('th', 'Id').should('have.class', 'hidden')
    cy.contains('th', 'Duration').should('have.class', 'hidden')

    // Tablet (sm) - ID becomes visible
    cy.viewport(640, 800)
    cy.contains('th', 'Id').should('be.visible')
    cy.contains('th', 'Duration').should('have.class', 'hidden')

    // Desktop (md) - Both visible
    cy.viewport(768, 1024)
    cy.contains('th', 'Id').should('be.visible')
    cy.contains('th', 'Duration').should('be.visible')
  })

  it('hides columns based on container width', () => {
    const libraryItem = { ...mockLibraryItem }
    libraryItem.media.chapters = [{ id: 1, start: 0, end: 60, title: 'Chapter 1' }]

    // Ensure viewport is large enough so hiddenBelow doesn't trigger
    cy.viewport(1024, 768)

    // 1. Wide enough for all (400px)
    cy.mount(
      <div style={{ width: '400px', boxSizing: 'border-box' }}>
        <ChaptersTable libraryItem={libraryItem} user={mockUser} expanded />
      </div>
    )
    cy.wait(200)
    cy.contains('th', 'Id').should('exist')
    cy.contains('th', 'Duration').should('exist')

    // 2. Hide Duration (300px)
    // ID requires ~246px -> Visible
    // Duration requires ~326px -> Hidden
    cy.mount(
      <div style={{ width: '300px', boxSizing: 'border-box' }}>
        <ChaptersTable libraryItem={libraryItem} user={mockUser} expanded />
      </div>
    )
    cy.wait(200)
    cy.contains('th', 'Id').should('exist')
    cy.contains('th', 'Duration').should('not.exist')

    // 3. Hide Id (200px)
    // ID requires ~246px -> Hidden
    cy.mount(
      <div style={{ width: '200px', boxSizing: 'border-box' }}>
        <ChaptersTable libraryItem={libraryItem} user={mockUser} expanded />
      </div>
    )
    cy.wait(200)
    cy.contains('th', 'Id').should('not.exist')
  })
})
