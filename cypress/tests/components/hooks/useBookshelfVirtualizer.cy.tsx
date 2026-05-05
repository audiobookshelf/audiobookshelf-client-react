import { CardSizeProvider, useCardSize } from '@/contexts/CardSizeContext'
import { useBookshelfVirtualizer, type UseBookshelfVirtualizerProps } from '@/hooks/useBookshelfVirtualizer'
import { useEffect, useState } from 'react'

type TestInitialProps = Partial<Record<keyof UseBookshelfVirtualizerProps, string | number>> & {
  sizeMultiplier?: string | number
}

function TestInner({ initialProps = {} }: { initialProps?: TestInitialProps }) {
  const { setSizeMultiplier } = useCardSize()
  const [inputState, setInputState] = useState(() => {
    const base = {
      totalEntities: '1000',
      cardWidth: '100',
      itemHeight: '100',
      containerWidth: '500',
      containerHeight: '500',
      sizeMultiplier: '1'
    }
    return {
      ...base,
      ...Object.fromEntries(Object.entries(initialProps).map(([k, v]) => [k, String(v)]))
    }
  })

  useEffect(() => {
    const sm = Number(inputState.sizeMultiplier)
    if (Number.isFinite(sm)) setSizeMultiplier(sm)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- test harness: apply initial CardSize once from merged form state
  }, [])

  const props = {
    totalEntities: Number(inputState.totalEntities),
    cardWidth: Number(inputState.cardWidth),
    itemHeight: Number(inputState.itemHeight),
    containerWidth: Number(inputState.containerWidth),
    containerHeight: Number(inputState.containerHeight)
  }

  const handleChange = (key: string, value: string) => {
    setInputState((prev) => ({ ...prev, [key]: value }))
    if (key === 'sizeMultiplier') {
      const n = Number(value)
      if (Number.isFinite(n)) setSizeMultiplier(n)
    }
  }

  const virtualizer = useBookshelfVirtualizer(props)

  return (
    <div className="flex gap-4">
      <div className="flex w-64 flex-col gap-2 border-r bg-gray-50 p-2">
        <label>
          Total Entities:
          <input
            data-cy="input-totalEntities"
            type="number"
            value={inputState.totalEntities}
            onChange={(e) => handleChange('totalEntities', e.target.value)}
            className="w-full border p-1"
          />
        </label>
        <label>
          Container Width:
          <input
            data-cy="input-containerWidth"
            type="number"
            value={inputState.containerWidth}
            onChange={(e) => handleChange('containerWidth', e.target.value)}
            className="w-full border p-1"
          />
        </label>
        <label>
          Card width:
          <input
            data-cy="input-cardWidth"
            type="number"
            value={inputState.cardWidth}
            onChange={(e) => handleChange('cardWidth', e.target.value)}
            className="w-full border p-1"
          />
        </label>
        <label>
          Item Height:
          <input
            data-cy="input-itemHeight"
            type="number"
            value={inputState.itemHeight}
            onChange={(e) => handleChange('itemHeight', e.target.value)}
            className="w-full border p-1"
          />
        </label>
        <label>
          Size multiplier:
          <input
            data-cy="input-sizeMultiplier"
            type="number"
            step="0.25"
            value={inputState.sizeMultiplier}
            onChange={(e) => handleChange('sizeMultiplier', e.target.value)}
            className="w-full border p-1"
          />
        </label>
        <div>
          Column gap (computed): <span data-cy="val-columnGap">{virtualizer.columnGap}</span>
        </div>
        <button data-cy="btn-scroll-1000" onClick={() => virtualizer.handleScroll(1000)} className="rounded bg-blue-500 p-2 text-white">
          Scroll to 1000
        </button>
        <button data-cy="btn-scroll-0" onClick={() => virtualizer.handleScroll(0)} className="rounded bg-gray-500 p-2 text-white">
          Scroll to 0
        </button>
        <button
          data-cy="btn-collapse"
          onClick={() => setInputState((p) => ({ ...p, itemHeight: '0', cardWidth: '0' }))}
          className="rounded bg-red-500 p-2 text-white"
        >
          Collapse
        </button>
        <button
          data-cy="btn-restore"
          onClick={() => setInputState((p) => ({ ...p, itemHeight: '100', cardWidth: '100' }))}
          className="rounded bg-green-500 p-2 text-white"
        >
          Restore
        </button>
      </div>

      <div className="flex-1 p-2">
        <div>
          Visible Start: <span data-cy="val-start">{virtualizer.visibleShelfStart}</span>
        </div>
        <div>
          Visible End: <span data-cy="val-end">{virtualizer.visibleShelfEnd}</span>
        </div>
        <div>
          Columns: <span data-cy="val-columns">{virtualizer.columns}</span>
        </div>
        <div>
          Total Shelves: <span data-cy="val-totalShelves">{virtualizer.totalShelves}</span>
        </div>
        <div>
          Shelf Height: <span data-cy="val-shelfHeight">{virtualizer.shelfHeight}</span>
        </div>
      </div>
    </div>
  )
}

function TestComponent({ initialProps = {} }: { initialProps?: TestInitialProps }) {
  return (
    <CardSizeProvider>
      <TestInner initialProps={initialProps} />
    </CardSizeProvider>
  )
}

describe('useBookshelfVirtualizer', () => {
  // CardSizeProvider caps sizeMultiplier at 5/6 when viewport width is < 640px (MOBILE_BREAKPOINT).
  // useBookshelfVirtualizer reads sizeMultiplier via useCardSize, so keep a desktop-width viewport
  // so expectations match integer gap math (e.g. 12 / 24 px at multiplier 1).
  beforeEach(() => {
    cy.viewport(800, 800)
  })

  it('calculates initial layout correctly', () => {
    cy.mount(<TestComponent />)

    // width 500 → gap 24; available 452 → 3 columns of 100px tracks
    cy.get('[data-cy="val-columnGap"]').should('have.text', '24')
    cy.get('[data-cy="val-columns"]').should('have.text', '3')
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '334')
    cy.get('[data-cy="val-start"]').should('have.text', '0')
    cy.get('[data-cy="val-end"]').should('have.text', '8')
  })

  it('updates visible range on scroll', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="btn-scroll-1000"]').click()

    cy.get('[data-cy="val-start"]').should('have.text', '8')
    cy.get('[data-cy="val-end"]').should('have.text', '18')

    cy.get('[data-cy="btn-scroll-0"]').click()
    cy.get('[data-cy="val-start"]').should('have.text', '0')
  })

  it('recalculates layout when container resizes', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="input-containerWidth"]').clear().type('1000')
    cy.get('[data-cy="input-containerWidth"]').should('have.value', '1000')

    cy.get('[data-cy="val-columnGap"]').should('have.text', '24')
    cy.get('[data-cy="val-columns"]').should('have.text', '7')
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '143')
  })

  it('handles item resizing and collapse', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="btn-collapse"]').click()
    cy.get('[data-cy="val-shelfHeight"]').should('have.text', '0')

    cy.get('[data-cy="btn-restore"]').click()
    cy.get('[data-cy="val-shelfHeight"]').should('have.text', '100')
    cy.get('[data-cy="val-start"]').should('have.text', '0')
  })

  it('uses 12px gap tier for any container width below 480 (w < 480)', () => {
    cy.mount(
      <TestComponent
        initialProps={{
          containerWidth: 400,
          cardWidth: 160,
          totalEntities: 10,
          sizeMultiplier: 1
        }}
      />
    )
    cy.get('[data-cy="val-columnGap"]').should('have.text', '12')
    // getBookshelfColumnGapPx: w < 480 → 12*sm; available = 400 - 24 = 376; floor((376 + 12) / 172) = 2
    cy.get('[data-cy="val-columns"]').should('have.text', '2')

    // Same tier at a narrower width (still two 160px columns)
    cy.get('[data-cy="input-containerWidth"]').clear().type('360')
    cy.get('[data-cy="val-columnGap"]').should('have.text', '12')
    cy.get('[data-cy="val-columns"]').should('have.text', '2')
  })

  it('drops to fewer columns when width crosses below 480 (gap 12 vs 24)', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="val-columns"]').should('have.text', '3')

    // Below 480: columnGap 12; narrow enough that only one 100px track fits between side insets
    cy.get('[data-cy="input-containerWidth"]').clear().type('220')
    cy.get('[data-cy="input-containerWidth"]').should('have.value', '220')

    cy.get('[data-cy="val-columnGap"]').should('have.text', '12')
    // available = 220 - 24 = 196; floor((196 + 12) / 112) = 1
    cy.get('[data-cy="val-columns"]').should('have.text', '1')
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '1000')
  })

  it('handles zero entities', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="input-totalEntities"]').clear().type('0')

    cy.get('[data-cy="val-totalShelves"]').should('have.text', '0')
  })
})
