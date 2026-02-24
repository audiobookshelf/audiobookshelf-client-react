import DataTable, { DataTableColumn } from '@/components/ui/DataTable'

interface TestData {
  id: number
  name: string
  description: string
}

const data: TestData[] = [
  { id: 1, name: 'Item 1', description: 'Description 1' },
  { id: 2, name: 'Item 2', description: 'Description 2' }
]

const columns: DataTableColumn<TestData>[] = [
  { label: 'ID', accessor: 'id' },
  { label: 'Name', accessor: 'name' },
  { label: 'Description', accessor: 'description', hiddenBelow: 'md' }
]

describe('DataTable', () => {
  it('renders correctly', () => {
    cy.mount(<DataTable data={data} columns={columns} getRowKey={(row) => row.id} />)
    cy.get('table').should('exist')
    cy.contains('Item 1').should('be.visible')
  })

  it('applies hidden classes based on hiddenBelow prop', () => {
    cy.mount(<DataTable data={data} columns={columns} getRowKey={(row) => row.id} />)

    // Check header
    cy.contains('th', 'Description').should('have.class', 'hidden')
    cy.contains('th', 'Description').should('have.class', 'md:table-cell')

    // Check cell
    cy.contains('td', 'Description 1').should('have.class', 'hidden')
    cy.contains('td', 'Description 1').should('have.class', 'md:table-cell')
  })

  describe('minTableWidth', () => {
    const minWidthColumns: DataTableColumn<TestData>[] = [
      { label: 'ID', accessor: 'id' },
      { label: 'Description', accessor: 'description', minTableWidth: 500 }
    ]

    it('hides column when table width is less than minTableWidth', () => {
      cy.viewport(400, 600)
      cy.mount(
        <div style={{ width: '400px' }}>
          <DataTable data={data} columns={minWidthColumns} getRowKey={(row) => row.id} />
        </div>
      )

      // Wait for ResizeObserver/useEffect
      cy.wait(100)

      cy.contains('th', 'ID').should('exist')
      cy.contains('th', 'Description').should('not.exist')
      cy.contains('td', 'Description 1').should('not.exist')
    })

    it('shows column when table width is greater than minTableWidth', () => {
      cy.viewport(600, 600)
      cy.mount(
        <div style={{ width: '600px' }}>
          <DataTable data={data} columns={minWidthColumns} getRowKey={(row) => row.id} />
        </div>
      )

      // Wait for ResizeObserver/useEffect
      cy.wait(100)

      cy.contains('th', 'ID').should('exist')
      cy.contains('th', 'Description').should('exist')
      cy.contains('td', 'Description 1').should('exist')
    })

    it('updates visibility when table resizes', () => {
      cy.viewport(400, 600)
      cy.mount(
        <div id="wrapper" style={{ width: '400px' }}>
          <DataTable data={data} columns={minWidthColumns} getRowKey={(row) => row.id} />
        </div>
      )

      cy.wait(100)
      cy.contains('th', 'Description').should('not.exist')

      // Resize wrapper to 600px
      cy.get('#wrapper').then(($el) => {
        $el.css('width', '600px')
      })

      // Force verify resize happened if needed, but ResizeObserver should catch it
      cy.wait(100)
      cy.contains('th', 'Description').should('exist')
    })
  })
})
