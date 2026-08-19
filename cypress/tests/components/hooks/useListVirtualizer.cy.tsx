import { useListVirtualizer } from '@/hooks/useListVirtualizer'
import { useCallback } from 'react'

interface VirtualRowProps {
  index: number
  start: number
  height: number
  measureElement?: (index: number, node: HTMLElement | null) => void
}

function VirtualRow({ index, start, height, measureElement }: VirtualRowProps) {
  const setRowRef = useCallback((node: HTMLDivElement | null) => measureElement?.(index, node), [index, measureElement])

  return (
    <div
      ref={setRowRef}
      data-cy="virtual-row"
      data-virtual-index={index}
      className="absolute top-0 left-0 w-full"
      style={{ height: `${height}px`, transform: `translateY(${start}px)` }}
    >
      Row {index}
    </div>
  )
}

/** `measure` off mirrors a fixed-height consumer such as EpisodeTable, which never wires `measureElement`. */
function VirtualListHarness({ totalItems = 100, firstRowHeight = 40, measure = true }: { totalItems?: number; firstRowHeight?: number; measure?: boolean }) {
  const { virtualItems, totalHeight, listContainerRef, measureElement } = useListVirtualizer(totalItems, 40)

  return (
    <div data-cy="scroll-root" className="relative h-[200px] overflow-y-auto">
      <div ref={listContainerRef} data-cy="virtual-list" className="relative w-full" style={{ height: `${totalHeight}px` }}>
        {virtualItems.map(({ index, start }) => (
          <VirtualRow
            key={index}
            index={index}
            start={start}
            height={index === 0 ? firstRowHeight : 40}
            measureElement={measure ? measureElement : undefined}
          />
        ))}
      </div>
    </div>
  )
}

describe('useListVirtualizer', () => {
  it('keeps the mounted row count bounded and advances the range on scroll', () => {
    cy.mount(<VirtualListHarness />)

    cy.get('[data-cy="virtual-list"]').should('have.css', 'height', '4000px')
    cy.get('[data-cy="virtual-row"]').should('have.length.lessThan', 20)
    cy.get('[data-cy="virtual-row"]').first().should('have.attr', 'data-virtual-index', '0')

    cy.get('[data-cy="scroll-root"]').scrollTo(0, 2000)

    cy.get('[data-cy="virtual-row"]').should('have.length.lessThan', 20)
    cy.get('[data-cy="virtual-row"]').first().should('have.attr', 'data-virtual-index', '47')
    cy.get('[data-cy="virtual-row"]').last().should('have.attr', 'data-virtual-index', '57')
  })

  it('uses measured row heights to position the list', () => {
    cy.mount(<VirtualListHarness totalItems={10} firstRowHeight={80} />)

    cy.get('[data-cy="virtual-list"]').should('have.css', 'height', '440px')
    cy.get('[data-virtual-index="1"]').should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 80)')
  })

  it('positions rows from the given row height when nothing is measured', () => {
    cy.mount(<VirtualListHarness measure={false} />)

    cy.get('[data-cy="virtual-list"]').should('have.css', 'height', '4000px')
    cy.get('[data-virtual-index="1"]').should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 40)')

    cy.get('[data-cy="scroll-root"]').scrollTo(0, 2000)

    cy.get('[data-cy="virtual-row"]').should('have.length.lessThan', 20)
    cy.get('[data-cy="virtual-row"]').first().should('have.attr', 'data-virtual-index', '47')
    cy.get('[data-cy="virtual-row"]').last().should('have.attr', 'data-virtual-index', '57')
  })

  it('ignores a taller rendered row when the consumer does not measure', () => {
    cy.mount(<VirtualListHarness totalItems={10} firstRowHeight={80} measure={false} />)

    cy.get('[data-cy="virtual-list"]').should('have.css', 'height', '400px')
    cy.get('[data-virtual-index="1"]').should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 40)')
  })

  it('clears unmounted row heights when the scroll container width changes', () => {
    cy.mount(<VirtualListHarness totalItems={10} firstRowHeight={80} />)

    cy.get('[data-virtual-index="1"]').should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 80)')

    cy.get('[data-cy="scroll-root"]').scrollTo(0, 800)

    cy.get('[data-cy="scroll-root"]').invoke('css', 'width', '300px')

    cy.get('[data-cy="scroll-root"]').scrollTo(0, 0)

    cy.get('[data-virtual-index="1"]').should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 80)')
    cy.get('[data-cy="virtual-list"]').should('have.css', 'height', '440px')
  })
})
