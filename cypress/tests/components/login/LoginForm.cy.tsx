import LoginForm from '@/app/(blank)/login/LoginForm'
import { BASE_PATH_ATTRIBUTE } from '@/lib/basePath'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'

/** The browser reads the base path off the root element the server layout renders. */
function serveFrom(basePath: string | null) {
  if (basePath === null) {
    document.documentElement.removeAttribute(BASE_PATH_ATTRIBUTE)
  } else {
    document.documentElement.setAttribute(BASE_PATH_ATTRIBUTE, basePath)
  }
}

function mountLoginForm({ search = '', serverUrl = 'https://audiobooks.example.com' }: { search?: string; serverUrl?: string } = {}) {
  const router = {
    back: cy.stub(),
    forward: cy.stub(),
    refresh: cy.stub(),
    push: cy.stub(),
    replace: cy.stub(),
    prefetch: cy.stub(),
    bfcacheId: 'test-bfcache-id'
  } as AppRouterInstance

  cy.mount(
    <AppRouterContext.Provider value={router}>
      <SearchParamsContext.Provider value={new URLSearchParams(search)}>
        <LoginForm authMethods={['openid']} authFormData={{ authOpenIDButtonText: 'Login with OpenId' }} serverUrl={serverUrl} />
      </SearchParamsContext.Provider>
    </AppRouterContext.Provider>
  )
}

describe('<LoginForm /> OpenID href', () => {
  afterEach(() => serveFrom(null))

  it('prefixes the OIDC callback with the configured base path', () => {
    serveFrom('/audiobookshelf')
    mountLoginForm()
    cy.get('a')
      .should('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.searchParams.get('callback')).to.equal('https://audiobooks.example.com/audiobookshelf/login')
      })
  })

  it('keeps /login at the origin when served from the root', () => {
    serveFrom('')
    mountLoginForm()
    cy.get('a')
      .should('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.searchParams.get('callback')).to.equal('https://audiobooks.example.com/login')
      })
  })

  it('puts a safe redirect on the callback URL, not the auth start URL', () => {
    serveFrom('/audiobookshelf')
    mountLoginForm({ search: 'redirect=/library/lib-1' })
    cy.get('a')
      .should('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.searchParams.get('redirect')).to.equal(null)
        const callback = new URL(url.searchParams.get('callback')!)
        expect(callback.pathname).to.equal('/audiobookshelf/login')
        expect(callback.searchParams.get('redirect')).to.equal('/library/lib-1')
      })
  })
})
