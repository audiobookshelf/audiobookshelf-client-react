import AppBarNav from '@/app/(main)/AppBarNav'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import * as navigation from 'next/navigation'
import { ReactNode } from 'react'

function mountAppBarNav(props: { userCanUpload?: boolean; isAdmin?: boolean; username?: string } = {}, options?: { alignEnd?: boolean }) {
  const router = {
    back: cy.stub(),
    forward: cy.stub(),
    refresh: cy.stub(),
    push: cy.stub(),
    replace: cy.stub(),
    prefetch: cy.stub()
  } as AppRouterInstance

  cy.stub(navigation, 'useRouter').callsFake(() => router)

  const appBarNav = <AppBarNav username={props.username ?? 'testuser'} isAdmin={props.isAdmin ?? false} userCanUpload={props.userCanUpload ?? false} />

  const ui: ReactNode = (
    <AppRouterContext.Provider value={router}>{options?.alignEnd ? <div className="absolute end-0">{appBarNav}</div> : appBarNav}</AppRouterContext.Provider>
  )

  cy.mount(ui)

  return router
}

describe('<AppBarNav /> desktop keyboard navigation', () => {
  beforeEach(() => {
    cy.viewport(1024, 768)
  })

  const desktopMenuTrigger = () => cy.get('button[aria-haspopup="menu"]')

  it('opens the menu with Enter on the desktop username button', () => {
    mountAppBarNav()
    desktopMenuTrigger().focus()
    desktopMenuTrigger().type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
  })

  it('highlights menu items with arrow keys while focus stays on the trigger', () => {
    mountAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    desktopMenuTrigger().should('have.focus')
    cy.get('[role="menuitem"]').eq(0).should('have.class', 'bg-dropdown-item-selected')
    desktopMenuTrigger().type('{downarrow}')
    cy.get('[role="menuitem"]').eq(1).should('have.class', 'bg-dropdown-item-selected')
    desktopMenuTrigger().should('have.focus')
    desktopMenuTrigger().type('{uparrow}')
    cy.get('[role="menuitem"]').eq(0).should('have.class', 'bg-dropdown-item-selected')
  })

  it('closes the menu with Escape and returns focus to the trigger', () => {
    mountAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
    desktopMenuTrigger().type('{esc}')
    cy.get('[role="menu"]').should('not.exist')
    desktopMenuTrigger().should('have.focus')
  })

  it('jumps to the first and last items with Home and End', () => {
    mountAppBarNav()
    desktopMenuTrigger().focus().type('{enter}')
    desktopMenuTrigger().type('{end}')
    cy.get('[role="menuitem"]').last().should('have.class', 'bg-dropdown-item-selected')
    desktopMenuTrigger().type('{home}')
    cy.get('[role="menuitem"]').first().should('have.class', 'bg-dropdown-item-selected')
    desktopMenuTrigger().should('have.focus')
  })

  it('excludes mobile-only items from the desktop menu', () => {
    mountAppBarNav({ isAdmin: true, userCanUpload: true })
    desktopMenuTrigger().click()
    cy.get('[role="menuitem"]').should('have.length', 4)
    cy.get('[role="menu"]').should('not.contain.text', 'Settings')
    cy.get('[role="menu"]').should('not.contain.text', 'Upload')
  })

  it('closes the menu when clicking outside', () => {
    mountAppBarNav({}, { alignEnd: true })
    desktopMenuTrigger().click()
    cy.get('[role="menu"]').should('be.visible')
    cy.get('html').click({ force: true })
    cy.get('[role="menu"]').should('not.exist')
  })

  it('closes the menu on Tab without moving focus to the document start', () => {
    mountAppBarNav()
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
