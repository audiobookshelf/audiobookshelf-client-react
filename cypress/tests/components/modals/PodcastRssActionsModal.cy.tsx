import PodcastRssActionsModal, { type PodcastRssActionSection } from '@/components/modals/PodcastRssActionsModal'
import { useState } from 'react'

/** Supplies an observable panel without importing the server action feature. */
function renderSection(section: PodcastRssActionSection) {
  return <div cy-id="rss-section-content">Panel: {section}</div>
}

/** Exercises the same open, close, and reopen lifecycle as a card menu. */
function ReopenableRssModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open RSS manager</button>
      <PodcastRssActionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} renderSection={renderSection} />
    </>
  )
}

describe('PodcastRssActionsModal', () => {
  it('renders the active operation directly in the desktop sectioned modal', () => {
    cy.viewport(1000, 800)
    cy.mount(<PodcastRssActionsModal isOpen onClose={cy.stub()} renderSection={renderSection} />)

    cy.get('[aria-label="Modal sections"]').should('be.visible')
    cy.get('[cy-id="rss-section-content"]').should('contain.text', 'Panel: schedule')
    // Each section is one word, so the rail never wraps.
    cy.get('[aria-label="Modal sections"]').contains('button', 'Lookup').click()
    cy.get('[cy-id="rss-section-content"]').should('contain.text', 'Panel: find-episodes')
    cy.get('[aria-label="Modal sections"]').contains('button', 'Check').click()
    cy.get('[cy-id="rss-section-content"]').should('contain.text', 'Panel: check-new-episodes')
  })

  it('shows the mobile hub and returns to it from each operation', () => {
    cy.viewport(390, 844)
    cy.mount(<PodcastRssActionsModal isOpen onClose={cy.stub()} renderSection={renderSection} />)

    cy.get('[aria-label="Modal sections"]').should('not.exist')
    for (const [label, section] of [
      ['Schedule', 'schedule'],
      ['Lookup', 'find-episodes'],
      ['Check', 'check-new-episodes']
    ]) {
      cy.contains('button', label).click()
      cy.get('[cy-id="rss-section-content"]').should('contain.text', `Panel: ${section}`)
      cy.get('button[aria-label="Back"]').click()
      cy.contains('button', label).should('be.visible')
    }
  })

  it('returns to Schedule after closing and reopening', () => {
    cy.viewport(1000, 800)
    cy.mount(<ReopenableRssModal />)

    cy.contains('button', 'Open RSS manager').click()
    cy.get('[aria-label="Modal sections"]').contains('button', 'Lookup').click()
    cy.get('[cy-id="rss-section-content"]').should('contain.text', 'Panel: find-episodes')
    cy.get('button[aria-label="Close modal"]').click()
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('button', 'Open RSS manager').click()
    cy.get('[cy-id="rss-section-content"]').should('contain.text', 'Panel: schedule')
  })
})
