import { useThrottledLatestSnapshot } from '@/hooks/useThrottledLatestSnapshot'
import { useCallback, useState } from 'react'

type Snapshot = { id: string; n: number }

function ItemUpdateHarness({ itemId, intervalMs = 200 }: { itemId: string; intervalMs?: number }) {
  const [applied, setApplied] = useState<number | null>(null)
  const apply = useCallback((snapshot: Snapshot) => {
    setApplied(snapshot.n)
  }, [])
  const schedule = useThrottledLatestSnapshot(itemId, apply, intervalMs)

  return (
    <div>
      <span data-cy="item-id">{itemId}</span>
      <span data-cy="applied">{applied === null ? 'none' : String(applied)}</span>
      <button data-cy="push-1" onClick={() => schedule({ id: itemId, n: 1 })}>
        Push 1
      </button>
      <button data-cy="push-2" onClick={() => schedule({ id: itemId, n: 2 })}>
        Push 2
      </button>
      <button data-cy="push-stale" onClick={() => schedule({ id: 'other-item', n: 99 })}>
        Push stale
      </button>
    </div>
  )
}

function SwitchableItemHarness() {
  const [itemId, setItemId] = useState('item-a')
  const [applied, setApplied] = useState<number | null>(null)
  const apply = useCallback((snapshot: Snapshot) => {
    setApplied(snapshot.n)
  }, [])
  const schedule = useThrottledLatestSnapshot(itemId, apply, 200)

  return (
    <div>
      <span data-cy="item-id">{itemId}</span>
      <span data-cy="applied">{applied === null ? 'none' : String(applied)}</span>
      <button data-cy="push-1" onClick={() => schedule({ id: 'item-a', n: 1 })}>
        Push 1
      </button>
      <button data-cy="switch" onClick={() => setItemId('item-b')}>
        Switch
      </button>
    </div>
  )
}

describe('useThrottledLatestSnapshot', () => {
  it('applies the latest snapshot after the interval and ignores a different item id', () => {
    cy.clock()
    cy.mount(<ItemUpdateHarness itemId="item-a" />)

    cy.get('[data-cy="push-1"]').click()
    cy.get('[data-cy="push-2"]').click()
    cy.get('[data-cy="push-stale"]').click()
    cy.get('[data-cy="applied"]').should('have.text', 'none')

    cy.tick(200)
    cy.get('[data-cy="applied"]').should('have.text', '2')
  })

  it('does not apply a pending snapshot after the item id changes', () => {
    cy.clock()
    cy.mount(<SwitchableItemHarness />)

    cy.get('[data-cy="push-1"]').click()
    cy.get('[data-cy="switch"]').click()
    cy.get('[data-cy="item-id"]').should('have.text', 'item-b')
    cy.tick(200)
    cy.get('[data-cy="applied"]').should('have.text', 'none')
  })

  it('does not apply a pending snapshot after unmount', () => {
    cy.clock()
    cy.mount(<ItemUpdateHarness itemId="item-a" />)

    cy.get('[data-cy="push-1"]').click()
    cy.mount(<div data-cy="unmounted">unmounted</div>)
    cy.tick(200)
    cy.get('[data-cy="unmounted"]').should('have.text', 'unmounted')
  })
})
