import LoadingIndicator from '@/components/ui/LoadingIndicator'

describe('<LoadingIndicator />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<LoadingIndicator />)
  })

  it('has a loading indicator', () => {
    cy.mount(<LoadingIndicator />)
    cy.get('&loading-indicator').should('exist')
  })

  it('has a loading text', () => {
    cy.mount(<LoadingIndicator />)
    cy.get('&loading-text').should('contain.text', 'Loading content')
  })
})
