import { registerOverlay, registerPage } from '@/lib/historyTrap'
import { StrictMode, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'

function OverlayStackExample() {
  const [playerOpen, setPlayerOpen] = useState(false)
  const [readerOpen, setReaderOpen] = useState(false)
  const [pageHeld, setPageHeld] = useState(false)

  useLayoutEffect(() => {
    if (!playerOpen) return
    return registerOverlay(() => {
      flushSync(() => setPlayerOpen(false))
    })
  }, [playerOpen])

  useLayoutEffect(() => {
    if (!readerOpen) return
    return registerOverlay(() => {
      flushSync(() => setReaderOpen(false))
    })
  }, [readerOpen])

  useLayoutEffect(() => {
    if (!pageHeld) return
    return registerPage(() => {
      // Hold the page like a guard without leavePath: restore dummy, do not navigate.
    })
  }, [pageHeld])

  return (
    <>
      <button onClick={() => setPlayerOpen(true)}>Open player</button>
      <button onClick={() => setReaderOpen(true)}>Open reader</button>
      <button onClick={() => setPageHeld((held) => !held)}>Toggle page</button>
      {playerOpen && (
        <>
          <p>Player fullscreen</p>
          <button onClick={() => setPlayerOpen(false)}>Close player</button>
        </>
      )}
      {readerOpen && (
        <>
          <p>eReader overlay</p>
          <button onClick={() => setReaderOpen(false)}>Close reader</button>
        </>
      )}
      {pageHeld && <p>Page held</p>}
    </>
  )
}

describe('historyTrap overlay stack', () => {
  // cy.go('back') waits for a hash change. Same-URL dummies do not fire that wait.
  function historyBack() {
    cy.window().then((win) => win.history.back())
  }

  beforeEach(() => {
    cy.window().then((win) => {
      win.history.replaceState({ page: 'previous' }, '', '#previous')
      win.history.pushState({ page: 'current', preserved: 'value' }, '', '#current')
    })
  })

  afterEach(() => {
    cy.mount(<></>)
    cy.window().should((win) => {
      expect(win.history.state?.__absHistoryTrap).to.eq(undefined)
    })
  })

  it('closes the last registered overlay first', () => {
    cy.mount(
      <StrictMode>
        <OverlayStackExample />
      </StrictMode>
    )
    cy.contains('Open player').click()
    cy.contains('Player fullscreen').should('exist')
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')
    cy.contains('Open reader').click()
    cy.contains('eReader overlay').should('exist')

    historyBack()
    cy.contains('eReader overlay').should('not.exist')
    cy.contains('Player fullscreen').should('exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')

    historyBack()
    cy.contains('Player fullscreen').should('not.exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state').should('not.have.property', '__absHistoryTrap')

    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  it('keeps the remaining overlay after the top overlay unregisters without Back', () => {
    cy.mount(<OverlayStackExample />)
    cy.contains('Open player').click()
    cy.contains('Open reader').click()
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')
    cy.window().then((win) => {
      const trapId = win.history.state.__absHistoryTrap.id
      cy.contains('Close reader').click()
      cy.contains('eReader overlay').should('not.exist')
      cy.contains('Player fullscreen').should('exist')
      cy.window().should((w) => {
        expect(w.history.state.__absHistoryTrap.id).to.eq(trapId)
      })
    })

    historyBack()
    cy.contains('Player fullscreen').should('not.exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state').should('not.have.property', '__absHistoryTrap')
  })

  it('closes an overlay before the page handler even when the page registered later', () => {
    cy.mount(<OverlayStackExample />)
    cy.contains('Open player').click()
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')
    cy.window().then((win) => {
      const lengthAfterOpen = win.history.length
      const trapId = win.history.state.__absHistoryTrap.id
      cy.contains('Toggle page').click()
      cy.contains('Page held').should('exist')
      cy.window().should((w) => {
        expect(w.history.length).to.eq(lengthAfterOpen)
        expect(w.history.state.__absHistoryTrap.id).to.eq(trapId)
      })
    })

    historyBack()
    cy.contains('Player fullscreen').should('not.exist')
    cy.contains('Page held').should('exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')

    historyBack()
    cy.contains('Page held').should('exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state.__absHistoryTrap.id').should('be.a', 'string')
  })
})
