import Toast, { ToastProps } from '@/components/widgets/Toast'

describe('<Toast />', () => {
  const defaultProps: ToastProps = {
    id: 'test-toast',
    message: 'Test message'
  }

  it('renders with default props', () => {
    cy.mount(<Toast {...defaultProps} />)
    cy.get('[cy-id="toast"]').should('exist')
    cy.contains('Test message').should('be.visible')
    cy.get('[cy-id="toast-icon"]').should('contain', 'info')
  })

  it('renders with title and message', () => {
    cy.mount(<Toast {...defaultProps} title="Test Title" message="Test message" />)
    cy.contains('Test Title').should('be.visible')
    cy.contains('Test message').should('be.visible')
  })

  it('renders success type correctly', () => {
    cy.mount(<Toast {...defaultProps} type="success" message="Success message" />)
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'bg-success')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'border-success')
    cy.get('[cy-id="toast-icon"]').should('contain', 'check_circle')
  })

  it('renders error type correctly', () => {
    cy.mount(<Toast {...defaultProps} type="error" message="Error message" />)
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'bg-error')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'border-error')
    cy.get('[cy-id="toast-icon"]').should('contain', 'error')
  })

  it('renders warning type correctly', () => {
    cy.mount(<Toast {...defaultProps} type="warning" message="Warning message" />)
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'bg-warning')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'border-warning')
    cy.get('[cy-id="toast-icon"]').should('contain', 'warning')
  })

  it('renders info type correctly', () => {
    cy.mount(<Toast {...defaultProps} type="info" message="Info message" />)
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'bg-info')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'border-info')
    cy.get('[cy-id="toast-icon"]').should('contain', 'info')
  })

  it('calls onClose when close button is clicked', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} onClose={onCloseSpy} />)

    cy.get('[cy-id="close-button"]').click()
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('auto-dismisses after specified duration', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={1000} onClose={onCloseSpy} />)

    // Wait for the duration plus a small buffer
    cy.wait(1100)
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('does not auto-dismiss when duration is 0', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={0} onClose={onCloseSpy} />)

    // Wait and verify it doesn't auto-dismiss
    cy.wait(2000)
    cy.get('@onCloseSpy').should('not.have.been.called')
  })

  it('does not auto-dismiss when duration is negative', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={-1000} onClose={onCloseSpy} />)

    // Wait and verify it doesn't auto-dismiss
    cy.wait(2000)
    cy.get('@onCloseSpy').should('not.have.been.called')
  })

  it('animates in when mounted', () => {
    cy.mount(<Toast {...defaultProps} />)

    // Initially should be invisible (translate-x-full opacity-0)
    cy.get('[cy-id="toast"]').should('have.class', 'translate-x-full')
    cy.get('[cy-id="toast"]').should('have.class', 'opacity-0')

    // After animation, should be visible
    cy.wait(400) // Wait for animation
    cy.get('[cy-id="toast"]').should('have.class', 'translate-x-0')
    cy.get('[cy-id="toast"]').should('have.class', 'opacity-100')
  })

  it('animates out when closing', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} onClose={onCloseSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Click close button
    cy.get('[cy-id="close-button"]').click()

    // Should animate out
    cy.get('[cy-id="toast"]').should('have.class', 'translate-x-full')
    cy.get('[cy-id="toast"]').should('have.class', 'opacity-0')

    // Should call onClose after animation
    cy.wait(400)
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('handles long messages correctly', () => {
    const longMessage =
      'This is a very long message that should wrap properly and not overflow the toast container. It should be contained within the max-width and display correctly.'
    cy.mount(<Toast {...defaultProps} message={longMessage} />)

    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'max-w-sm')
    cy.contains(longMessage).should('be.visible')
  })

  it('handles empty message', () => {
    cy.mount(<Toast {...defaultProps} message="" />)
    cy.get('[cy-id="toast"]').should('exist')
    cy.get('[cy-id="toast-icon"]').should('exist')
  })

  it('handles empty title', () => {
    cy.mount(<Toast {...defaultProps} title="" message="Test message" />)
    cy.get('[cy-id="toast"]').should('exist')
    cy.contains('Test message').should('be.visible')
  })

  it('renders without title section when title is not provided', () => {
    cy.mount(<Toast {...defaultProps} message="Test message" />)
    cy.get('[cy-id="toast"]').should('exist')
    cy.contains('Test message').should('be.visible')
    // Should not have title styling
    cy.get('[cy-id="toast"]').should('not.contain', 'font-semibold')
  })

  it('has correct accessibility attributes', () => {
    cy.mount(<Toast {...defaultProps} />)
    cy.get('[cy-id="close-button"]').should('have.attr', 'aria-label', 'Close notification')
  })

  it('handles multiple rapid close clicks', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} onClose={onCloseSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Click close button multiple times
    cy.get('[cy-id="close-button"]').click()
    cy.get('[cy-id="close-button"]').click()
    cy.get('[cy-id="close-button"]').click()

    // Should only call onClose once (the first click should trigger the close)
    cy.wait(400)
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('handles click to close', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} onClose={onCloseSpy} />)

    // Wait for initial animation
    cy.wait(400)

    // Click toast
    cy.get('[cy-id="toast"]').click()
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('handles undefined onClose prop', () => {
    cy.mount(<Toast {...defaultProps} />)

    // Should not throw error when close button is clicked
    cy.get('[cy-id="close-button"]').click()
    // The toast should still exist since onClose is undefined and doesn't remove it
    cy.get('[cy-id="toast"]').should('exist')
  })

  it('handles different duration values', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={500} onClose={onCloseSpy} />)

    // Should auto-dismiss after 500ms
    cy.wait(600)
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('handles very short duration', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={100} onClose={onCloseSpy} />)

    // Should auto-dismiss after 100ms
    cy.wait(200)
    cy.get('@onCloseSpy').should('have.been.calledWith', 'test-toast')
  })

  it('handles very long duration', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    cy.mount(<Toast {...defaultProps} duration={10000} onClose={onCloseSpy} />)

    // Should not auto-dismiss within 2 seconds
    cy.wait(2000)
    cy.get('@onCloseSpy').should('not.have.been.called')
  })

  it('has correct styling classes', () => {
    cy.mount(<Toast {...defaultProps} type="success" />)

    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'border')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'rounded-lg')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'shadow-lg')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'p-4')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'max-w-sm')
    cy.get('[cy-id="toast"]').find('div').first().should('have.class', 'w-full')
  })

  it('has correct transition classes', () => {
    cy.mount(<Toast {...defaultProps} />)

    cy.get('[cy-id="toast"]').should('have.class', 'transform')
    cy.get('[cy-id="toast"]').should('have.class', 'transition-all')
    cy.get('[cy-id="toast"]').should('have.class', 'duration-300')
    cy.get('[cy-id="toast"]').should('have.class', 'ease-in-out')
  })

  it('renders close button with correct styling', () => {
    cy.mount(<Toast {...defaultProps} />)

    cy.get('[cy-id="close-button"]').should('have.class', 'text-white/70')
    cy.get('[cy-id="close-button"]').should('have.class', 'hover:text-white')
    cy.get('[cy-id="close-button"]').should('have.class', 'transition-colors')
    cy.get('[cy-id="close-button"]').should('have.class', 'duration-200')
    cy.get('[cy-id="close-button"]').should('contain', '×')
  })

  it('handles all toast types with different content', () => {
    const toastTypes = ['success', 'error', 'warning', 'info'] as const

    toastTypes.forEach((type) => {
      cy.mount(<Toast {...defaultProps} type={type} title={`${type} title`} message={`${type} message`} />)

      cy.get('[cy-id="toast"]').should('exist')
      cy.contains(`${type} title`).should('be.visible')
      cy.contains(`${type} message`).should('be.visible')

      // Check for correct icon
      const expectedIcon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'
      cy.get('[cy-id="toast-icon"]').should('contain', expectedIcon)
    })
  })
})
