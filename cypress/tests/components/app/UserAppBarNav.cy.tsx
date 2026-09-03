import UserAppBarNav from '@/app/(main)/UserAppBarNav'
import { UserContext, type UserContextType } from '@/contexts/UserContext'
import { User } from '@/types/api'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import * as navigation from 'next/navigation'
import { ReactNode } from 'react'

const DEFAULT_MOCK_USER_PERMISSIONS: User['permissions'] = {
  download: true,
  update: true,
  delete: true,
  upload: false,
  accessAllLibraries: true,
  accessAllTags: true,
  accessExplicitContent: true,
  createEreader: true,
  selectedTagsNotAccessible: false
}

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    type: 'user',
    token: 'test-token',
    permissions: DEFAULT_MOCK_USER_PERMISSIONS,
    mediaProgress: [],
    seriesHideFromContinueListening: [],
    bookmarks: [],
    isActive: true,
    isLocked: false,
    createdAt: 1234567890,
    librariesAccessible: [],
    itemTagsSelected: [],
    hasOpenIDLink: false,
    ...overrides
  }
}

function createMockUserContextValue(user: User): UserContextType {
  return {
    user,
    userCanUpdate: true,
    userCanDelete: true,
    userCanDownload: true,
    userCanUpload: user.permissions.upload,
    userIsAdminOrUp: user.type === 'admin' || user.type === 'root',
    token: user.token,
    serverSettings: {} as UserContextType['serverSettings'],
    userDefaultLibraryId: 'test-library-id',
    ereaderDevices: [],
    Source: 'test',
    getMediaItemProgress: () => undefined,
    getBookmarksForLibraryItem: () => [],
    mergeServerSettings: () => {},
    clientSettings: {},
    updateClientSetting: () => {}
  }
}

function mountUserAppBarNav(props: { username?: string } = {}, options?: { alignEnd?: boolean }) {
  const router = {
    back: cy.stub(),
    forward: cy.stub(),
    refresh: cy.stub(),
    push: cy.stub(),
    replace: cy.stub(),
    prefetch: cy.stub(),
    bfcacheId: 'test-bfcache-id'
  } as AppRouterInstance

  cy.stub(navigation, 'useRouter').callsFake(() => router)

  const user = createMockUser({
    username: props.username ?? 'testuser'
  })

  const userAppBarNav = <UserAppBarNav />

  const ui: ReactNode = (
    <UserContext.Provider value={createMockUserContextValue(user)}>
      <AppRouterContext.Provider value={router}>
        {options?.alignEnd ? <div className="absolute inset-e-0">{userAppBarNav}</div> : userAppBarNav}
      </AppRouterContext.Provider>
    </UserContext.Provider>
  )

  cy.mount(ui)

  return router
}

describe('<UserAppBarNav /> desktop keyboard navigation', () => {
  beforeEach(() => {
    cy.viewport(1024, 768)
  })

  const desktopMenuTrigger = () => cy.get('button[aria-haspopup="menu"]').filter(':visible')

  it('opens the menu with Enter on the desktop username button', () => {
    mountUserAppBarNav()
    desktopMenuTrigger().focus()
    desktopMenuTrigger().type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
  })

  it('highlights menu items with arrow keys while focus stays on the trigger', () => {
    mountUserAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    desktopMenuTrigger().should('have.focus')
    cy.get('[role="menuitem"]').eq(0).should('have.class', 'bg-dropdown-item-focused')
    desktopMenuTrigger().type('{downarrow}')
    cy.get('[role="menuitem"]').eq(1).should('have.class', 'bg-dropdown-item-focused')
    desktopMenuTrigger().should('have.focus')
    desktopMenuTrigger().type('{uparrow}')
    cy.get('[role="menuitem"]').eq(0).should('have.class', 'bg-dropdown-item-focused')
  })

  it('closes the menu with Escape and returns focus to the trigger', () => {
    mountUserAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
    desktopMenuTrigger().type('{esc}')
    cy.get('[role="menu"]').should('not.exist')
    desktopMenuTrigger().should('have.focus')
  })

  it('jumps to the first and last items with Home and End', () => {
    mountUserAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    desktopMenuTrigger().type('{end}')
    cy.get('[role="menuitem"]').last().should('have.class', 'bg-dropdown-item-focused')
    desktopMenuTrigger().type('{home}')
    cy.get('[role="menuitem"]').first().should('have.class', 'bg-dropdown-item-focused')
    desktopMenuTrigger().should('have.focus')
  })

  it('excludes mobile-only items from the desktop menu', () => {
    mountUserAppBarNav()
    desktopMenuTrigger().click()
    cy.get('[role="menuitem"]').should('have.length', 4)
    cy.get('[role="menu"]').should('not.contain.text', 'Settings')
    cy.get('[role="menu"]').should('not.contain.text', 'Upload')
  })

  it('closes the menu when clicking outside', () => {
    mountUserAppBarNav({}, { alignEnd: true })
    desktopMenuTrigger().click()
    cy.get('[role="menu"]').should('be.visible')
    cy.get('html').click({ force: true })
    cy.get('[role="menu"]').should('not.exist')
  })

  it('closes the menu on Tab without moving focus to the document start', () => {
    mountUserAppBarNav()
    cy.document().then((doc) => {
      const sentinel = doc.createElement('button')
      sentinel.textContent = 'after menu'
      sentinel.id = 'tab-sentinel-after'
      doc.body.appendChild(sentinel)
    })
    desktopMenuTrigger().focus().type('{enter}')
    cy.realPress('Tab')
    cy.get('[role="menu"]').should('not.exist')
    cy.get('#tab-sentinel-after').should('have.focus')
    cy.document().then((doc) => {
      doc.getElementById('tab-sentinel-after')?.remove()
    })
  })
})
