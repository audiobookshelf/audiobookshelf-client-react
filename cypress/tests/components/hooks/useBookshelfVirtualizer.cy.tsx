import { useBookshelfVirtualizer, type UseBookshelfVirtualizerProps } from '@/hooks/useBookshelfVirtualizer'
import { useState } from 'react'

type TestInitialProps = Partial<{ [K in keyof UseBookshelfVirtualizerProps]: string | number }>

const TestComponent = ({ initialProps = {} }: { initialProps?: TestInitialProps }) => {
  // Use strings for input state to allow empty values and prevent "0" glitch
  const [inputState, setInputState] = useState({
    totalEntities: '1000',
    cardWidth: '100',
    columnGap: '0',
    itemHeight: '100',
    containerWidth: '500',
    containerHeight: '500',
    padding: '0',
    ...Object.entries(initialProps).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
  })

  // Convert to numbers for the hook
  const props = {
    totalEntities: Number(inputState.totalEntities),
    cardWidth: Number(inputState.cardWidth),
    columnGap: Number(inputState.columnGap),
    itemHeight: Number(inputState.itemHeight),
    containerWidth: Number(inputState.containerWidth),
    containerHeight: Number(inputState.containerHeight),
    padding: Number(inputState.padding)
  }

  const handleChange = (key: string, value: string) => {
    setInputState((prev) => ({ ...prev, [key]: value }))
  }

  // Expose virtualizer state
  const virtualizer = useBookshelfVirtualizer(props)

  return (
    <div className="flex gap-4">
      {/* Controls */}
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
          Column gap:
          <input
            data-cy="input-columnGap"
            type="number"
            value={inputState.columnGap}
            onChange={(e) => handleChange('columnGap', e.target.value)}
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
          Padding:
          <input
            data-cy="input-padding"
            type="number"
            value={inputState.padding}
            onChange={(e) => handleChange('padding', e.target.value)}
            className="w-full border p-1"
          />
        </label>
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

      {/* Output */}
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

describe('useBookshelfVirtualizer', () => {
  it('calculates initial layout correctly', () => {
    cy.mount(<TestComponent />)

    // 500px width / 100px item = 5 columns
    cy.get('[data-cy="val-columns"]').should('have.text', '5')
    // 1000 entities / 5 columns = 200 shelves
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '200')
    // Start should be 0
    cy.get('[data-cy="val-start"]').should('have.text', '0')
    // 500px height / 100px item = 5 visible rows
    // Buffer is 2. So usually 0 to 5+2+1 = 8?
    // Formula: end = floor((scrollTop + h) / shelfHeight) + buffer + 1
    // end = floor((0 + 500)/100) + 2 + 1 = 5 + 3 = 8
    cy.get('[data-cy="val-end"]').should('have.text', '8')
  })

  it('updates visible range on scroll', () => {
    cy.mount(<TestComponent />)

    // Scroll to 1000px (10 shelves down)
    cy.get('[data-cy="btn-scroll-1000"]').click()

    // Start: floor(1000/100) - 2 = 10 - 2 = 8
    cy.get('[data-cy="val-start"]').should('have.text', '8')
    // End: floor((1000+500)/100) + 2 + 1 = 15 + 3 = 18
    cy.get('[data-cy="val-end"]').should('have.text', '18')

    // Scroll back to 0
    cy.get('[data-cy="btn-scroll-0"]').click()
    cy.get('[data-cy="val-start"]').should('have.text', '0')
  })

  it('recalculates layout when container resizes', () => {
    cy.mount(<TestComponent />)

    // Change container width to 1000 (double)
    // Clear first (state becomes ''), then type
    cy.get('[data-cy="input-containerWidth"]').clear().type('1000')

    // Verify input value to be sure
    cy.get('[data-cy="input-containerWidth"]').should('have.value', '1000')

    // 1000 / 100 = 10 columns
    cy.get('[data-cy="val-columns"]').should('have.text', '10')
    // 1000 entities / 10 cols = 100 shelves
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '100')
  })

  it('handles item resizing and collapse', () => {
    cy.mount(<TestComponent />)

    // Collapse (simulating loading state or zero size)
    cy.get('[data-cy="btn-collapse"]').click()
    // Should handle gracefully
    cy.get('[data-cy="val-shelfHeight"]').should('have.text', '0')

    // Restore
    cy.get('[data-cy="btn-restore"]').click()
    cy.get('[data-cy="val-shelfHeight"]').should('have.text', '100')
    cy.get('[data-cy="val-start"]').should('have.text', '0')
  })

  it('counts columns using card width plus between-column gaps only', () => {
    cy.mount(
      <TestComponent
        initialProps={{
          containerWidth: 380,
          padding: 16,
          cardWidth: 160,
          columnGap: 24,
          totalEntities: 10
        }}
      />
    )
    // available = 380 - 32 = 348; max n with n*160 + (n-1)*24 <= 348 => n=2 (344px row)
    cy.get('[data-cy="val-columns"]').should('have.text', '2')
  })

  it('uses full container width when padding is zero (narrow collection-style viewport)', () => {
    cy.mount(
      <TestComponent
        initialProps={{
          containerWidth: 348,
          padding: 0,
          cardWidth: 160,
          columnGap: 24,
          totalEntities: 10
        }}
      />
    )
    // floor((348 + 24) / 184) = 2 — would drop to 1 if callers subtracted an extra ~32px “shelf” inset on top of page padding
    cy.get('[data-cy="val-columns"]').should('have.text', '2')
  })

  it('respects padding', () => {
    cy.mount(<TestComponent />)

    // Add 20px padding (applied to both sides -> 40px subtraction)
    // 500 - 40 = 460 available width
    // floor((460 + 0) / (100 + 0)) = 4 columns
    cy.get('[data-cy="input-padding"]').clear().type('20')

    // Verify input value
    cy.get('[data-cy="input-padding"]').should('have.value', '20')

    cy.get('[data-cy="val-columns"]').should('have.text', '4')
    // 1000 / 4 = 250 shelves
    cy.get('[data-cy="val-totalShelves"]').should('have.text', '250')
  })

  it('handles zero entities', () => {
    cy.mount(<TestComponent />)

    cy.get('[data-cy="input-totalEntities"]').clear().type('0')

    cy.get('[data-cy="val-totalShelves"]').should('have.text', '0')
  })
})
