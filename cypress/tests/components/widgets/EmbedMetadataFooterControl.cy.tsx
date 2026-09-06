import EmbedMetadataFooterControl from '@/components/widgets/EmbedMetadataFooterControl'
import { TasksContext, type TasksContextType } from '@/contexts/TasksContext'
import { UserContext, type UserContextType } from '@/contexts/UserContext'
import { BookLibraryItem, User } from '@/types/api'

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

function createUserContextValue(overrides: Partial<UserContextType> = {}): UserContextType {
  return {
    user: mockUser,
    userCanUpdate: true,
    userCanDelete: true,
    userCanDownload: true,
    userCanUpload: true,
    userIsAdminOrUp: true,
    token: mockUser.token,
    serverSettings: {} as UserContextType['serverSettings'],
    userDefaultLibraryId: 'test-library-id',
    ereaderDevices: [],
    Source: 'test',
    getMediaItemProgress: () => undefined,
    getBookmarksForLibraryItem: () => [],
    mergeServerSettings: () => {},
    ...overrides
  }
}

function createTasksContextValue(overrides: Partial<TasksContextType> = {}): TasksContextType {
  return {
    tasks: [],
    queuedEmbedLIds: [],
    audioFilesEncoding: {},
    audioFilesFinished: {},
    taskProgress: {},
    addUpdateTask: () => {},
    removeTask: () => {},
    getTasksByLibraryItemId: () => [],
    getAudioFilesEncoding: () => undefined,
    getAudioFilesFinished: () => undefined,
    getTaskProgress: () => undefined,
    getTasksByLibraryId: () => [],
    ...overrides
  }
}

const mockBook: BookLibraryItem = {
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
    duration: 120,
    size: 1000,
    numTracks: 1,
    ebookFile: undefined
  },
  libraryFiles: []
}

function mountControl(userOverrides: Partial<UserContextType> = {}, libraryItem: BookLibraryItem | null = mockBook) {
  cy.mount(
    <UserContext.Provider value={createUserContextValue(userOverrides)}>
      <TasksContext.Provider value={createTasksContextValue()}>
        <EmbedMetadataFooterControl libraryItem={libraryItem} />
      </TasksContext.Provider>
    </UserContext.Provider>
  )
}

describe('<EmbedMetadataFooterControl />', () => {
  it('renders a single Embed button for an admin book with tracks', () => {
    mountControl()
    cy.get('[cy-id="embed-metadata-footer-control"]').should('contain.text', 'Embed')
    cy.get('[aria-haspopup="listbox"]').should('not.exist')
  })

  it('does not render for non-admin users', () => {
    mountControl({ userIsAdminOrUp: false })
    cy.get('[cy-id="embed-metadata-footer-control"]').should('not.exist')
  })

  it('opens the backup confirm dialog', () => {
    mountControl()
    cy.get('[cy-id="embed-metadata-footer-control"] button').click()
    cy.contains('Are you sure you want to embed metadata in 1 audio files?').should('be.visible')
    cy.contains('Backup Audio Files').should('be.visible')
  })
})
