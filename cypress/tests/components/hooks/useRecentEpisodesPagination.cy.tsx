import { useRecentEpisodesPagination } from '@/hooks/useRecentEpisodesPagination'
import { RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'
import type { GetRecentEpisodesResponse, RecentPodcastEpisode } from '@/types/api'

type FetchPage = (page: number) => Promise<GetRecentEpisodesResponse>

function makeEpisode(index: number): RecentPodcastEpisode {
  return { id: `episode-${index}` } as RecentPodcastEpisode
}

function makeEpisodes(start: number, count: number): RecentPodcastEpisode[] {
  return Array.from({ length: count }, (_, index) => makeEpisode(start + index))
}

function makeResponse(episodes: RecentPodcastEpisode[], page: number): GetRecentEpisodesResponse {
  return {
    episodes,
    limit: RECENT_EPISODES_PAGE_SIZE,
    page
  }
}

function PaginationProbe({
  initialEpisodes,
  fetchPage,
  onError,
  autoLoadTrigger
}: {
  initialEpisodes: RecentPodcastEpisode[]
  fetchPage: FetchPage
  onError: (error: unknown) => void
  autoLoadTrigger?: boolean
}) {
  const { episodes, hasMore, autoLoadEnabled, isLoading, loadMore } = useRecentEpisodesPagination({ initialEpisodes, fetchPage, onError })

  return (
    <div>
      <span data-cy="episode-ids">{episodes.map((episode) => episode.id).join(',')}</span>
      <span data-cy="episode-count">{episodes.length}</span>
      <span data-cy="has-more">{String(hasMore)}</span>
      <span data-cy="auto-load-enabled">{String(autoLoadEnabled)}</span>
      <span data-cy="is-loading">{String(isLoading)}</span>
      {autoLoadTrigger && (
        <button data-cy="auto-load" onClick={() => void loadMore()}>
          Auto load
        </button>
      )}
      <button data-cy="load-more" onClick={() => void loadMore({ manual: true })}>
        Load more
      </button>
      <button
        data-cy="load-more-twice"
        onClick={() => {
          void loadMore({ manual: true })
          void loadMore({ manual: true })
        }}
      >
        Load more twice
      </button>
    </div>
  )
}

describe('useRecentEpisodesPagination', () => {
  const initialEpisodes = makeEpisodes(0, RECENT_EPISODES_PAGE_SIZE)

  it('appends unique episodes and stops after a short page', () => {
    const fetchPage = cy.stub().resolves(makeResponse([makeEpisode(49), makeEpisode(50), makeEpisode(51)], 1))

    cy.mount(<PaginationProbe initialEpisodes={initialEpisodes} fetchPage={fetchPage} onError={cy.stub()} />)
    cy.get('[data-cy="load-more"]').click()

    cy.wrap(fetchPage).should('have.been.calledOnceWith', 1)
    cy.get('[data-cy="episode-count"]').should('have.text', '52')
    cy.get('[data-cy="episode-ids"]').should('contain.text', 'episode-50,episode-51')
    cy.get('[data-cy="has-more"]').should('have.text', 'false')
  })

  it('advances through duplicate full pages until new episodes are appended', () => {
    const fetchPage = cy.stub()
    fetchPage.onFirstCall().resolves(makeResponse(makeEpisodes(0, RECENT_EPISODES_PAGE_SIZE), 1))
    fetchPage.onSecondCall().resolves(makeResponse(makeEpisodes(50, RECENT_EPISODES_PAGE_SIZE), 2))

    cy.mount(<PaginationProbe initialEpisodes={initialEpisodes} fetchPage={fetchPage} onError={cy.stub()} />)
    cy.get('[data-cy="load-more"]').click()

    cy.wrap(fetchPage)
      .should('have.been.calledTwice')
      .then(() => {
        expect(fetchPage.firstCall.args).to.deep.equal([1])
        expect(fetchPage.secondCall.args).to.deep.equal([2])
      })
    cy.get('[data-cy="episode-count"]').should('have.text', '100')
    cy.get('[data-cy="has-more"]').should('have.text', 'true')
  })

  it('advances the page only after a successful full response', () => {
    const fetchPage = cy.stub()
    fetchPage.onFirstCall().resolves(makeResponse(makeEpisodes(50, RECENT_EPISODES_PAGE_SIZE), 1))
    fetchPage.onSecondCall().resolves(makeResponse([makeEpisode(100)], 2))

    cy.mount(<PaginationProbe initialEpisodes={initialEpisodes} fetchPage={fetchPage} onError={cy.stub()} />)
    cy.get('[data-cy="load-more"]').click()
    cy.get('[data-cy="episode-count"]').should('have.text', '100')
    cy.get('[data-cy="has-more"]').should('have.text', 'true')
    cy.get('[data-cy="load-more"]').click()

    cy.wrap(fetchPage)
      .should('have.been.calledTwice')
      .then(() => expect(fetchPage.secondCall.args).to.deep.equal([2]))
    cy.get('[data-cy="episode-count"]').should('have.text', '101')
    cy.get('[data-cy="has-more"]').should('have.text', 'false')
  })

  it('retains the page after an error so the request can be retried', () => {
    const error = new Error('request failed')
    const onError = cy.stub()
    const fetchPage = cy.stub()
    fetchPage.onFirstCall().rejects(error)
    fetchPage.onSecondCall().resolves(makeResponse([makeEpisode(50)], 1))

    cy.mount(<PaginationProbe initialEpisodes={initialEpisodes} fetchPage={fetchPage} onError={onError} autoLoadTrigger />)
    cy.get('[data-cy="load-more"]').click()

    cy.wrap(onError).should('have.been.calledOnceWith', error)
    cy.get('[data-cy="episode-count"]').should('have.text', String(RECENT_EPISODES_PAGE_SIZE))
    cy.get('[data-cy="has-more"]').should('have.text', 'true')
    cy.get('[data-cy="auto-load-enabled"]').should('have.text', 'false')
    cy.get('[data-cy="is-loading"]').should('have.text', 'false')
    cy.get('[data-cy="auto-load"]').click()

    cy.wrap(fetchPage).should('have.been.calledOnceWith', 1)
    cy.get('[data-cy="load-more"]').click()

    cy.wrap(fetchPage)
      .should('have.been.calledTwice')
      .then(() => expect(fetchPage.secondCall.args).to.deep.equal([1]))
    cy.get('[data-cy="episode-count"]').should('have.text', '51')
  })

  it('suppresses concurrent requests for the same page', () => {
    let resolveRequest!: (response: GetRecentEpisodesResponse) => void
    const request = new Promise<GetRecentEpisodesResponse>((resolve) => {
      resolveRequest = resolve
    })
    const fetchPage = cy.stub().returns(request)

    cy.mount(<PaginationProbe initialEpisodes={initialEpisodes} fetchPage={fetchPage} onError={cy.stub()} />)
    cy.get('[data-cy="load-more-twice"]').click()

    cy.wrap(fetchPage).should('have.been.calledOnceWith', 1)
    cy.get('[data-cy="is-loading"]').should('have.text', 'true')
    cy.then(() => resolveRequest(makeResponse([makeEpisode(50)], 1)))
    cy.get('[data-cy="episode-count"]').should('have.text', '51')
    cy.get('[data-cy="is-loading"]').should('have.text', 'false')
  })
})
