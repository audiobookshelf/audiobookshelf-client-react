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

  it('opens the menu with Enter on the desktop username button', () => {
    mountAppBarNav()
    cy.get('button[aria-haspopup="menu"]').focus()
    cy.get('button[aria-haspopup="menu"]').type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
  })

  it('moves focus between menu items with arrow keys', () => {
    mountAppBarNav()
    cy.get('button[aria-haspopup="menu"]').focus().type('{enter}')
    cy.get('[role="menuitem"]').eq(0).should('have.focus')
    cy.focused().type('{downarrow}')
    cy.get('[role="menuitem"]').eq(1).should('have.focus')
    cy.focused().type('{uparrow}')
    cy.get('[role="menuitem"]').eq(0).should('have.focus')
  })

  it('closes the menu with Escape and returns focus to the trigger', () => {
    mountAppBarNav()
    cy.get('button[aria-haspopup="menu"]').focus().type('{enter}')
    cy.get('[role="menu"]').should('be.visible')
    cy.focused().type('{esc}')
    cy.get('[role="menu"]').should('not.exist')
    cy.get('button[aria-haspopup="menu"]').should('have.focus')
  })

  it('jumps to the first and last items with Home and End', () => {
    mountAppBarNav()
    cy.get('button[aria-haspopup="menu"]').focus().type('{enter}')
    cy.focused().type('{end}')
    cy.get('[role="menuitem"]').last().should('have.focus')
    cy.focused().type('{home}')
    cy.get('[role="menuitem"]').first().should('have.focus')
  })

  it('excludes mobile-only items from the desktop menu', () => {
    mountAppBarNav({ isAdmin: true, userCanUpload: true })
    cy.get('button[aria-haspopup="menu"]').click()
    cy.get('[role="menuitem"]').should('have.length', 4)
    cy.get('[role="menu"]').should('not.contain.text', 'Settings')
    cy.get('[role="menu"]').should('not.contain.text', 'Upload')
  })

  it('closes the menu when clicking outside', () => {
    mountAppBarNav({}, { alignEnd: true })
    cy.get('button[aria-haspopup="menu"]').click()
    cy.get('[role="menu"]').should('be.visible')
    cy.get('html').click({ force: true })
    cy.get('[role="menu"]').should('not.exist')
  })
})
