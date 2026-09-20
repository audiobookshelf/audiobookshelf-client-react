import PodcastRssStatusDetails from '@/components/widgets/media-card/PodcastRssStatusDetails'
import type { PodcastRssStatusSummary } from '@/components/widgets/media-card/podcastRssStatus'
import { UserContext, type UserContextType } from '@/contexts/UserContext'
import { User } from '@/types/api'
import type { ReactNode } from 'react'

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

/** Empty server settings make the cron formatter fall back to English. */
const mockUserContextValue: UserContextType = {
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
  mergeServerSettings: () => {}
}

function mountStatus(status: PodcastRssStatusSummary) {
  const wrapped: ReactNode = (
    <UserContext.Provider value={mockUserContextValue}>
      <PodcastRssStatusDetails status={status} cyId="podcast-rss-status" />
    </UserContext.Provider>
  )
  cy.mount(wrapped)
}

describe('PodcastRssStatusDetails', () => {
  it('shows a running schedule under the plain Schedule heading', () => {
    mountStatus({ hasFeed: true, autoDownloadEnabled: true, autoDownloadSchedule: '0 6 * * 1-5' })

    cy.get('[cy-id="podcast-rss-status"]').should('contain.text', 'RSS feed configured').and('contain.text', 'Auto-download enabled')
    cy.get('[cy-id="podcast-rss-status-schedule"]').should('be.visible').and('contain.text', 'Schedule:').and('not.contain.text', 'inactive')
  })

  // The reporting issue asks to see what the schedule is set to, so a stored
  // schedule stays visible while automatic fetching is switched off.
  it('still shows a stored schedule when automatic fetching is disabled, marked inactive', () => {
    mountStatus({ hasFeed: true, autoDownloadEnabled: false, autoDownloadSchedule: '0 6 * * 1-5' })

    cy.get('[cy-id="podcast-rss-status"]').should('contain.text', 'Auto-download disabled')
    cy.get('[cy-id="podcast-rss-status-schedule"]').should('be.visible').and('contain.text', 'Schedule (inactive):')
  })

  it('omits the schedule line when no schedule is stored', () => {
    mountStatus({ hasFeed: true, autoDownloadEnabled: false, autoDownloadSchedule: undefined })

    cy.get('[cy-id="podcast-rss-status"]').should('contain.text', 'Auto-download disabled')
    cy.get('[cy-id="podcast-rss-status-schedule"]').should('not.exist')
  })

  it('reports a missing source feed', () => {
    mountStatus({ hasFeed: false, autoDownloadEnabled: false, autoDownloadSchedule: undefined })

    cy.get('[cy-id="podcast-rss-status"]').should('contain.text', 'RSS feed missing')
    cy.get('[cy-id="podcast-rss-status-schedule"]').should('not.exist')
  })

  it('renders a human-readable description of the stored cron expression', () => {
    mountStatus({ hasFeed: true, autoDownloadEnabled: true, autoDownloadSchedule: '0 6 * * 1-5' })

    // cronstrue phrasing is not asserted verbatim; the line must not fall back
    // to the formatter's parse-failure text for a valid expression.
    cy.get('[cy-id="podcast-rss-status-schedule"]').should('not.contain.text', 'Could not generate')
  })
})
