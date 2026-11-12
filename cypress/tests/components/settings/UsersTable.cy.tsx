import UsersTable from '@/app/(main)/settings/users/UsersTable'
import { SocketProvider } from '@/contexts/SocketContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { UserContext, type UserContextType } from '@/contexts/UserContext'
import { PlaybackSession, User } from '@/types/api'
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useState } from 'react'

function createUser(username: string, overrides: Partial<User> = {}): User {
  return {
    id: username,
    username,
    type: 'user',
    mediaProgress: [],
    seriesHideFromContinueListening: [],
    bookmarks: [],
    isActive: true,
    isLocked: false,
    createdAt: Date.UTC(2024, 0, 1),
    permissions: {
      download: true,
      update: true,
      delete: true,
      upload: false,
      accessAllLibraries: true,
      accessAllTags: true,
      accessExplicitContent: true,
      createEreader: true,
      selectedTagsNotAccessible: false
    },
    librariesAccessible: [],
    itemTagsSelected: [],
    hasOpenIDLink: false,
    ...overrides
  }
}

function createUsers(): User[] {
  return [
    createUser('reader10', {
      createdAt: Date.UTC(2024, 0, 12),
      lastSeen: Date.UTC(2026, 0, 12),
      latestSession: { displayTitle: 'chapter 10' } as PlaybackSession
    }),
    createUser('alice', { type: 'root', createdAt: Date.UTC(2023, 11, 31) }),
    createUser('reader2', {
      type: 'guest',
      createdAt: Date.UTC(2024, 1, 1),
      lastSeen: Date.UTC(2026, 1, 1),
      latestSession: { displayTitle: 'Chapter 2' } as PlaybackSession
    }),
    createUser('Zoe', {
      type: 'admin',
      createdAt: Date.UTC(2024, 0, 2),
      latestSession: { displayTitle: '' } as PlaybackSession
    })
  ]
}

function UsersTableHarness({ initialUsers, updatedUsers }: { initialUsers: User[]; updatedUsers?: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  return (
    <>
      {updatedUsers && <button onClick={() => setUsers(updatedUsers)}>Update users</button>}
      <UsersTable users={users} dateFormat="MM/dd/yyyy" timeFormat="HH:mm" onEditUser={() => {}} />
    </>
  )
}

function mountUsersTable(users = createUsers(), updatedUsers?: User[]) {
  const user = createUser('current-admin', { type: 'admin' })
  const userContext: UserContextType = {
    user,
    userCanUpdate: true,
    userCanDelete: true,
    userCanDownload: true,
    userCanUpload: false,
    userIsAdminOrUp: true,
    serverSettings: {} as UserContextType['serverSettings'],
    ereaderDevices: [],
    setEreaderDevices: () => {},
    Source: 'test',
    getMediaItemProgress: () => undefined,
    getBookmarksForLibraryItem: () => [],
    mergeServerSettings: () => {}
  }
  const router = {
    back: cy.stub(),
    forward: cy.stub(),
    refresh: cy.stub(),
    push: cy.stub(),
    replace: cy.stub(),
    prefetch: cy.stub(),
    bfcacheId: 'test-bfcache-id'
  } as AppRouterInstance

  // Exercise the real provider offline without reaching an Audiobookshelf server.
  cy.intercept('**/socket.io/**', { statusCode: 503, body: '' })

  cy.mount(
    <AppRouterContext.Provider value={router}>
      <ToastProvider>
        <SocketProvider accessToken={null}>
          <UserContext.Provider value={userContext}>
            <UsersTableHarness initialUsers={users} updatedUsers={updatedUsers} />
          </UserContext.Provider>
        </SocketProvider>
      </ToastProvider>
    </AppRouterContext.Provider>
  )
}

function expectUserOrder(usernames: string[]) {
  cy.get('tbody tr').should(($rows) => {
    const actual = Array.from($rows, (row) => row.querySelector('td')?.textContent?.trim())
    expect(actual).to.deep.equal(usernames)
  })
}

describe('<UsersTable /> sorting', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.clock(Date.UTC(2026, 10, 12), ['Date'])
  })

  it('initially sorts unsorted input by creation time ascending without mutating it', () => {
    const users = createUsers()
    Object.freeze(users)
    mountUsersTable(users)
    expectUserOrder(['alice', 'Zoe', 'reader10', 'reader2'])
  })

  it('sorts usernames naturally and case-insensitively in both directions', () => {
    mountUsersTable()
    cy.contains('th', 'Username').click()
    expectUserOrder(['Zoe', 'reader10', 'reader2', 'alice'])
    cy.contains('th', 'Username').click()
    expectUserOrder(['alice', 'reader2', 'reader10', 'Zoe'])
  })

  it('sorts account types in both directions', () => {
    mountUsersTable()
    cy.contains('th', 'Account Type').click()
    expectUserOrder(['reader10', 'alice', 'reader2', 'Zoe'])
    cy.contains('th', 'Account Type').click()
    expectUserOrder(['Zoe', 'reader2', 'alice', 'reader10'])
  })

  it('sorts latest session titles and keeps missing or empty activity last in both directions', () => {
    mountUsersTable()
    cy.contains('th', 'Activity').click()
    expectUserOrder(['reader10', 'reader2', 'alice', 'Zoe'])
    cy.contains('th', 'Activity').click()
    expectUserOrder(['reader2', 'reader10', 'alice', 'Zoe'])
  })

  it('sorts last seen by timestamp and keeps missing values last in both directions', () => {
    mountUsersTable()
    cy.contains('th', 'Last Seen').click()
    expectUserOrder(['reader2', 'reader10', 'alice', 'Zoe'])
    cy.contains('th', 'Last Seen').click()
    expectUserOrder(['reader10', 'reader2', 'alice', 'Zoe'])
  })

  it('sorts creation timestamps across years in both directions', () => {
    mountUsersTable()
    cy.contains('th', 'Created At').click()
    expectUserOrder(['reader2', 'reader10', 'Zoe', 'alice'])
    cy.contains('th', 'Created At').click()
    expectUserOrder(['alice', 'Zoe', 'reader10', 'reader2'])
  })

  it('starts a newly selected column descending after another column was ascending', () => {
    mountUsersTable()
    cy.contains('th', 'Username').click().click()
    expectUserOrder(['alice', 'reader2', 'reader10', 'Zoe'])
    cy.contains('th', 'Account Type').click()
    expectUserOrder(['reader10', 'alice', 'reader2', 'Zoe'])
    cy.contains('th', 'Created At').click()
    expectUserOrder(['reader2', 'reader10', 'Zoe', 'alice'])
  })

  it('reapplies the selected sort when users are updated', () => {
    const users = createUsers()
    const updatedUsers = users.map((user) => (user.username === 'alice' ? { ...user, lastSeen: Date.UTC(2026, 10, 11) } : user))
    mountUsersTable(users, updatedUsers)
    cy.contains('th', 'Last Seen').click()
    expectUserOrder(['reader2', 'reader10', 'alice', 'Zoe'])
    cy.contains('button', 'Update users').click()
    expectUserOrder(['alice', 'reader2', 'reader10', 'Zoe'])
    cy.contains('th', 'Last Seen').click()
    expectUserOrder(['reader10', 'reader2', 'alice', 'Zoe'])
  })
})
