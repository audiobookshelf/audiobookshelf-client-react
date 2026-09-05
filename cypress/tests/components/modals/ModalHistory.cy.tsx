import Modal from '@/components/modals/Modal'
import { useUnsavedNavigationGuard } from '@/hooks/useUnsavedNavigationGuard'
import { StrictMode, useState } from 'react'

function Example({ persistent = false, processing = false, guarded = false, confirmClose = false, ignoreClose = false }) {
  const [open, setOpen] = useState(false)
  const [nested, setNested] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [dirty, setDirty] = useState(guarded)
  useUnsavedNavigationGuard({ enabled: dirty })

  return (
    <>
      <button onClick={() => setOpen(true)}>Open parent</button>
      <Modal isOpen={open} persistent={persistent} processing={processing} onClose={() => !ignoreClose && (confirmClose ? setConfirm(true) : setOpen(false))}>
        <p>Parent dialog</p>
        <input aria-label="Draft" defaultValue="Keep this draft" />
        <button onClick={() => setNested(true)}>Open child</button>
        <button onClick={() => setOpen(false)}>Save and close</button>
        <button onClick={() => setDirty(!dirty)}>Toggle unsaved guard</button>
      </Modal>
      <Modal isOpen={nested} onClose={() => setNested(false)}>
        <p>Child dialog</p>
      </Modal>
      <Modal isOpen={confirm} onClose={() => setConfirm(false)}>
        <p>Discard changes?</p>
        <button
          onClick={() => {
            setConfirm(false)
            setOpen(false)
          }}
        >
          Discard
        </button>
      </Modal>
    </>
  )
}

describe('Modal browser history', () => {
  beforeEach(() => {
    // Seed real same-document page entries so Back cannot leave the test runner.
    cy.window().then((win) => {
      win.history.replaceState({ page: 'previous' }, '', '#previous')
      win.history.pushState({ page: 'current', preserved: 'value' }, '', '#current')
    })
  })

  afterEach(() => {
    cy.mount(<></>)
    cy.window().should((win) => {
      expect(win.history.state?.__absModal).to.eq(undefined)
      expect(win.history.state?.__unsavedGuard).to.eq(undefined)
    })
  })

  it('closes a modal before navigating back', () => {
    cy.mount(<Example />)
    cy.contains('Open parent').click()
    cy.go('back')
    cy.contains('Parent dialog').should('not.exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state.preserved').should('eq', 'value')
    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  it('closes nested dialogs one at a time and preserves the parent draft', () => {
    cy.mount(<Example />)
    cy.contains('Open parent').click()
    cy.get('input').clear().type('Unsaved draft')
    cy.contains('Open child').click()
    cy.go('back')
    cy.contains('Child dialog').should('not.exist')
    cy.get('input').should('have.value', 'Unsaved draft')
    cy.location('hash').should('eq', '#current')
    cy.go('back')
    cy.contains('Parent dialog').should('not.exist')
    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  for (const close of ['button', 'escape', 'save', 'backdrop']) {
    it(`removes history after ${close} dismissal`, () => {
      cy.mount(
        <StrictMode>
          <Example />
        </StrictMode>
      )
      for (let iteration = 0; iteration < 3; iteration++) {
        cy.contains('Open parent').click()
        if (close === 'button') cy.get('[cy-id="modal-close-button"]').click()
        if (close === 'escape') cy.get('input').type('{esc}')
        if (close === 'save') cy.contains('Save and close').click()
        if (close === 'backdrop') cy.get('[data-abs-modal]').click(1, 200)
        cy.get('[data-abs-modal]').should('not.exist')
        cy.window().its('history.state').should('not.have.property', '__absModal')
      }
      cy.go('back')
      cy.location('hash').should('eq', '#previous')
    })
  }

  for (const flag of ['persistent', 'processing']) {
    it(`keeps a ${flag} dialog and its page on repeated Back`, () => {
      cy.mount(<Example {...{ [flag]: true }} />)
      cy.contains('Open parent').click()
      for (let iteration = 0; iteration < 3; iteration++) {
        cy.go('back')
        cy.contains('Parent dialog').should('exist')
        cy.location('hash').should('eq', '#current')
        cy.window().its('history.state.__absModal.depth').should('eq', 1)
      }
    })
  }

  it('uses the business close callback and puts its confirmation above the parent', () => {
    cy.mount(<Example confirmClose />)
    cy.contains('Open parent').click()
    cy.go('back')
    cy.contains('Discard changes?').should('exist')
    cy.contains('Parent dialog').should('exist')
    cy.go('back')
    cy.contains('Discard changes?').should('not.exist')
    cy.contains('Parent dialog').should('exist')
    cy.go('back')
    cy.contains('button', 'Discard').click()
    cy.get('[data-abs-modal]').should('not.exist')
    cy.window().its('history.state').should('not.have.property', '__absModal')
    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  it('consumes Back before the earlier unsaved-page listener', () => {
    cy.mount(<Example guarded />)
    cy.contains('Open parent').click()
    cy.contains('Open child').click()
    cy.go('back')
    cy.contains('Child dialog').should('not.exist')
    cy.contains('Parent dialog').should('exist')
    cy.go('back')
    cy.contains('Parent dialog').should('not.exist')
    cy.window().its('history.state').should('have.property', '__unsavedGuard', true)
    cy.go('back')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state').should('have.property', '__unsavedGuard', true)
  })

  it('does not reopen dialogs or strand an extra entry on Forward', () => {
    cy.mount(<Example />)
    cy.contains('Open parent').click()
    cy.go('back')
    cy.get('[data-abs-modal]').should('not.exist')
    // Wait for the settled traversal, not an assertion that can pass before Forward starts.
    cy.window().then(
      (win) =>
        new Cypress.Promise<void>((resolve) => {
          const onPop = () => {
            if (win.history.state?.__absModal) return
            win.removeEventListener('popstate', onPop)
            resolve()
          }
          win.addEventListener('popstate', onPop)
          win.history.forward()
        })
    )
    cy.window().its('history.state').should('not.have.property', '__absModal')
    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  it('does not undo a real navigation when the modal unmounts', () => {
    cy.mount(<Example />)
    cy.contains('Open parent').click()
    cy.window().then((win) => win.history.pushState({ page: 'next' }, '', '#next'))
    cy.mount(<></>)
    cy.location('hash').should('eq', '#next')
    cy.window().then((win) => win.addEventListener('popstate', cy.stub().as('routerPop')))
    cy.go('back')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state').should('not.have.property', '__absModal')
    cy.get('@routerPop').should('have.been.calledOnce')
    cy.go('back')
    cy.location('hash').should('eq', '#previous')
  })

  it('restores protection if the close callback declines dismissal', () => {
    cy.mount(<Example ignoreClose />)
    cy.contains('Open parent').click()
    cy.go('back')
    cy.contains('Parent dialog').should('exist')
    cy.location('hash').should('eq', '#current')
    cy.window().its('history.state.__absModal.depth').should('eq', 1)
  })

  it('handles two queued Back operations without skipping the page', () => {
    cy.mount(<Example />)
    cy.contains('Open parent').click()
    cy.contains('Open child').click()
    cy.window().then((win) => {
      win.history.back()
      win.history.back()
    })
    cy.get('[data-abs-modal]').should('not.exist')
    cy.location('hash').should('eq', '#current')
  })

  for (const guarded of [false, true]) {
    it(`coordinates guard ${guarded ? 'removal' : 'setup'} while a modal is open`, () => {
      cy.mount(
        <StrictMode>
          <Example guarded={guarded} />
        </StrictMode>
      )
      cy.contains('Open parent').click()
      cy.contains('Toggle unsaved guard').click()
      cy.go('back')
      cy.get('[data-abs-modal]').should('not.exist')
      cy.location('hash').should('eq', '#current')
      if (guarded) {
        cy.window().its('history.state').should('not.have.property', '__unsavedGuard')
        cy.go('back')
        cy.location('hash').should('eq', '#previous')
      } else {
        cy.window().its('history.state.__unsavedGuard').should('eq', true)
        cy.go('back')
        cy.location('hash').should('eq', '#current')
      }
    })
  }
})
