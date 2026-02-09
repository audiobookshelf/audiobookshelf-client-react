import ToastContainer, { ToastMessage } from '@/components/widgets/ToastContainer'
import * as ReactDOM from 'react-dom'

describe('<ToastContainer />', () => {
  const mockToasts: ToastMessage[] = [
    {
      id: 'toast-1',
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
      duration: 5000
    },
    {
      id: 'toast-2',
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      duration: 0
    },
    {
      id: 'toast-3',
      type: 'warning',
      message: 'Warning message without title',
      duration: 3000
    }
  ]

  beforeEach(() => {
    // Mock createPortal to render in the test environment
    cy.stub(ReactDOM, 'createPortal').callsFake((children) => children)
  })

  it('renders multiple toasts correctly', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('have.length', 3)
    cy.contains('Success').should('be.visible')
    cy.contains('Operation completed successfully').should('be.visible')
    cy.contains('Error').should('be.visible')
    cy.contains('Something went wrong').should('be.visible')
    cy.contains('Warning message without title').should('be.visible')
  })

  it('renders empty container when no toasts', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={[]} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('not.exist')
  })

  it('calls onRemove when toast is closed', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Click close button on first toast
    cy.get('[cy-id="close-button"]').first().click()

    // Should call onRemove with correct id
    cy.wait(400)
    cy.get('@onRemoveSpy').should('have.been.calledWith', 'toast-1')
  })

  it('renders toasts with correct types and styling', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // Check success toast styling
    cy.get('[cy-id="toast"] > div').first().should('have.class', 'bg-success')
    cy.get('[cy-id="toast-icon"]').first().should('contain', 'check_circle')

    // Check error toast styling
    cy.get('[cy-id="toast"] > div').eq(1).should('have.class', 'bg-error')
    cy.get('[cy-id="toast-icon"]').eq(1).should('contain', 'error')

    // Check warning toast styling
    cy.get('[cy-id="toast"] > div').eq(2).should('have.class', 'bg-warning')
    cy.get('[cy-id="toast-icon"]').eq(2).should('contain', 'warning')
  })

  it('renders toasts with and without titles', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // First toast has title
    cy.contains('Success').should('be.visible')
    cy.contains('Operation completed successfully').should('be.visible')

    // Second toast has title
    cy.contains('Error').should('be.visible')
    cy.contains('Something went wrong').should('be.visible')

    // Third toast has no title
    cy.contains('Warning message without title').should('be.visible')
    // Should not have title styling
    cy.get('[cy-id="toast"]').eq(2).should('not.contain', 'font-semibold')
  })

  it('has correct container styling', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    cy.get('.fixed').should('exist')
    cy.get('.top-4').should('exist')
    cy.get('.end-4').should('exist')
    cy.get('.z-80').should('exist')
    cy.get('.space-y-2').should('exist')
  })

  it('handles dynamic toast updates', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    const initialToasts = [mockToasts[0]]
    const updatedToasts = [mockToasts[0], mockToasts[1]]

    cy.mount(<ToastContainer toasts={initialToasts} onRemove={onRemoveSpy} />)
    cy.get('[cy-id="toast"]').should('have.length', 1)

    // Update toasts
    cy.mount(<ToastContainer toasts={updatedToasts} onRemove={onRemoveSpy} />)
    cy.get('[cy-id="toast"]').should('have.length', 2)
  })

  it('handles toast removal correctly', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Remove middle toast
    cy.get('[cy-id="close-button"]').eq(1).click()
    cy.wait(400)
    cy.get('@onRemoveSpy').should('have.been.calledWith', 'toast-2')
  })

  it('handles multiple rapid toast removals', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Click close buttons rapidly
    cy.get('[cy-id="close-button"]').first().click()
    cy.get('[cy-id="close-button"]').eq(1).click()
    cy.get('[cy-id="close-button"]').eq(2).click()

    // Should call onRemove for each
    cy.wait(400)
    cy.get('@onRemoveSpy').should('have.been.calledWith', 'toast-1')
    cy.get('@onRemoveSpy').should('have.been.calledWith', 'toast-2')
    cy.get('@onRemoveSpy').should('have.been.calledWith', 'toast-3')
  })

  it('renders toasts with different durations', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // First toast has 5 second duration
    cy.get('[cy-id="toast"]').first().should('exist')

    // Second toast has 0 duration (no auto-dismiss)
    cy.get('[cy-id="toast"]').eq(1).should('exist')

    // Third toast has 3 second duration
    cy.get('[cy-id="toast"]').eq(2).should('exist')
  })

  it('handles empty toast array', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={[]} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('not.exist')
  })

  it('handles single toast', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    const singleToast = [mockToasts[0]]
    cy.mount(<ToastContainer toasts={singleToast} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('have.length', 1)
    cy.contains('Success').should('be.visible')
    cy.contains('Operation completed successfully').should('be.visible')
  })

  it('renders toasts in correct order', () => {
    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={mockToasts} onRemove={onRemoveSpy} />)

    // Check order of toasts
    cy.get('[cy-id="toast"]').eq(0).should('contain', 'Success')
    cy.get('[cy-id="toast"]').eq(1).should('contain', 'Error')
    cy.get('[cy-id="toast"]').eq(2).should('contain', 'Warning message without title')
  })

  it('handles toasts with missing optional props', () => {
    const minimalToasts: ToastMessage[] = [
      {
        id: 'minimal-toast',
        message: 'Minimal toast'
      }
    ]

    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={minimalToasts} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('have.length', 1)
    cy.contains('Minimal toast').should('be.visible')
    cy.get('[cy-id="toast-icon"]').should('contain', 'info') // Default info icon
  })

  it('handles toasts with all optional props', () => {
    const fullToasts: ToastMessage[] = [
      {
        id: 'full-toast',
        type: 'success',
        title: 'Full Toast',
        message: 'Complete toast with all props',
        duration: 10000
      }
    ]

    const onRemoveSpy = cy.spy().as('onRemoveSpy')
    cy.mount(<ToastContainer toasts={fullToasts} onRemove={onRemoveSpy} />)

    cy.get('[cy-id="toast"]').should('have.length', 1)
    cy.contains('Full Toast').should('be.visible')
    cy.contains('Complete toast with all props').should('be.visible')
    cy.get('[cy-id="toast-icon"]').should('contain', 'check_circle')
  })
})
