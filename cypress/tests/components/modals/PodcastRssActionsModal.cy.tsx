import PodcastRssActionsModal from '@/components/modals/PodcastRssActionsModal'

describe('PodcastRssActionsModal', () => {
  it('renders the three RSS actions and invokes Find Episodes', () => {
    const onClose = cy.stub().as('onClose')
    const onOpenSchedule = cy.stub().as('onOpenSchedule')
    const onFindEpisodes = cy.stub().as('onFindEpisodes')
    const onCheckNewEpisodes = cy.stub().as('onCheckNewEpisodes')

    cy.mount(
      <PodcastRssActionsModal
        isOpen
        onClose={onClose}
        onOpenSchedule={onOpenSchedule}
        onFindEpisodes={onFindEpisodes}
        onCheckNewEpisodes={onCheckNewEpisodes}
      />
    )

    cy.contains('Podcast RSS Actions').should('be.visible')
    cy.contains('button', 'Schedule').should('be.visible')
    cy.contains('button', 'Find Episodes').should('be.visible')
    cy.contains('button', /Check for New Episodes/i).should('be.visible')
    cy.contains('button', 'Find Episodes').click()

    cy.get('@onClose').should('have.been.calledOnce')
    cy.get('@onFindEpisodes').should('have.been.calledOnce')
    cy.get('@onOpenSchedule').should('not.have.been.called')
    cy.get('@onCheckNewEpisodes').should('not.have.been.called')
  })

  it('delegates Schedule to its existing host', () => {
    const onClose = cy.stub().as('onClose')
    const onOpenSchedule = cy.stub().as('onOpenSchedule')
    const onFindEpisodes = cy.stub().as('onFindEpisodes')
    const onCheckNewEpisodes = cy.stub().as('onCheckNewEpisodes')

    cy.mount(
      <PodcastRssActionsModal
        isOpen
        onClose={onClose}
        onOpenSchedule={onOpenSchedule}
        onFindEpisodes={onFindEpisodes}
        onCheckNewEpisodes={onCheckNewEpisodes}
      />
    )

    cy.contains('button', 'Schedule').click()

    cy.get('@onOpenSchedule').should('have.been.calledOnce')
    cy.get('@onFindEpisodes').should('not.have.been.called')
    cy.get('@onCheckNewEpisodes').should('not.have.been.called')
    cy.get('@onClose').should('have.been.calledOnce')
  })

  it('delegates Check for New Episodes to its existing host', () => {
    const onClose = cy.stub().as('onClose')
    const onOpenSchedule = cy.stub().as('onOpenSchedule')
    const onFindEpisodes = cy.stub().as('onFindEpisodes')
    const onCheckNewEpisodes = cy.stub().as('onCheckNewEpisodes')

    cy.mount(
      <PodcastRssActionsModal
        isOpen
        onClose={onClose}
        onOpenSchedule={onOpenSchedule}
        onFindEpisodes={onFindEpisodes}
        onCheckNewEpisodes={onCheckNewEpisodes}
      />
    )

    cy.contains('button', /Check for New Episodes/i).click()

    cy.get('@onCheckNewEpisodes').should('have.been.calledOnce')
    cy.get('@onOpenSchedule').should('not.have.been.called')
    cy.get('@onFindEpisodes').should('not.have.been.called')
    cy.get('@onClose').should('have.been.calledOnce')
  })
})
