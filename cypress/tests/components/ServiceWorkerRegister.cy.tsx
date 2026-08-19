import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

describe('<ServiceWorkerRegister />', () => {
  beforeEach(() => {
    // The component only touches navigator.serviceWorker.register; provide a stubbable container
    // if the test browser lacks one, then stub register so nothing actually installs.
    if (!('serviceWorker' in navigator)) {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { register: () => Promise.resolve() }
      })
    }
    cy.stub(navigator.serviceWorker, 'register').as('swRegister').resolves()
  })

  it('registers /sw.js at root scope on a root deploy', () => {
    cy.mount(<ServiceWorkerRegister basePath="" enabled />)
    cy.get('@swRegister').should('have.been.calledOnceWith', '/sw.js', { scope: '/' })
  })

  it('registers under the base path on a subfolder deploy', () => {
    cy.mount(<ServiceWorkerRegister basePath="/audiobookshelf" enabled />)
    cy.get('@swRegister').should('have.been.calledOnceWith', '/audiobookshelf/sw.js', { scope: '/audiobookshelf/' })
  })

  it('does not register when disabled (mirrors the production-only guard)', () => {
    cy.mount(<ServiceWorkerRegister basePath="" enabled={false} />)
    // Same gate as register(): only then would an enabled worker call register().
    cy.document().its('readyState').should('eq', 'complete')
    cy.get('@swRegister').should('not.have.been.called')
  })
})
