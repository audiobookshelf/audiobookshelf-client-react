import RecentEpisodesLoadMore from '@/components/widgets/RecentEpisodesLoadMore'

describe('<RecentEpisodesLoadMore />', () => {
  it('loads when its sentinel intersects the nearest scroll container', () => {
    const observe = cy.stub()
    const disconnect = cy.stub()
    const onLoadMore = cy.stub()
    let observerCallback!: IntersectionObserverCallback
    let observerOptions: IntersectionObserverInit | undefined

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds = []

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = callback
        observerOptions = options
      }

      observe(target: Element) {
        observe(target)
      }

      disconnect() {
        disconnect()
      }

      takeRecords(): IntersectionObserverEntry[] {
        return []
      }

      unobserve() {}
    }

    cy.window().then((win) => {
      win.IntersectionObserver = MockIntersectionObserver
    })

    cy.mount(
      <div data-cy="scroll-root" style={{ height: '200px', overflowY: 'auto' }}>
        <div style={{ height: '1000px' }} />
        <RecentEpisodesLoadMore isLoading={false} onLoadMore={onLoadMore} />
      </div>
    )

    cy.get('[cy-id="recent-episodes-load-sentinel"]').then(($sentinel) => {
      expect(observe.calledOnceWith($sentinel[0])).to.equal(true)
    })
    cy.get('[data-cy="scroll-root"]').then(($scrollRoot) => {
      expect(observerOptions?.root).to.equal($scrollRoot[0])
      expect(observerOptions?.rootMargin).to.equal('600px 0px')

      observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], null as unknown as IntersectionObserver)
      expect(onLoadMore.called).to.equal(false)

      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], null as unknown as IntersectionObserver)
      expect(onLoadMore.calledOnce).to.equal(true)
    })
  })
})
