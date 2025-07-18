import React from 'react'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import styles from '@/components/widgets/LoadingSpinner.module.css'

describe('<LoadingSpinner />', () => {
  it('renders a basic loading spinner', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).should('have.length', 8)
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'position', 'absolute')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'border-radius', '100%')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'animation-name', styles['ball-spin-clockwise'])
  })

  it('renders with default props correctly', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-sm'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '16px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '16px')
  })

  it('applies small size correctly', () => {
    cy.mount(<LoadingSpinner size="la-sm" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-sm'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '16px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '16px')
  })

  it('applies large size correctly', () => {
    cy.mount(<LoadingSpinner size="la-lg" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-lg'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '32px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '32px')
  })

  it('applies 2x size correctly', () => {
    cy.mount(<LoadingSpinner size="la-2x" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-2x'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '64px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '64px')
  })

  it('applies 3x size correctly', () => {
    cy.mount(<LoadingSpinner size="la-3x" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-3x'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '96px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '96px')
  })

  it('applies dark theme correctly', () => {
    cy.mount(<LoadingSpinner dark />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-dark'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(38, 38, 38)')
  })

  it('applies light theme by default', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('not.have.class', styles['la-dark'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(255, 255, 255)')
  })

  it('applies custom color via style prop', () => {
    cy.mount(<LoadingSpinner color="#ff0000" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(255, 0, 0)')
  })

  it('applies custom className', () => {
    cy.mount(<LoadingSpinner className="custom-spinner" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', 'custom-spinner')
  })

  it('applies multiple class names in className prop', () => {
    cy.mount(<LoadingSpinner className="class1 class2 class3" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', 'class1')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', 'class2')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', 'class3')
  })

  it('handles empty string className', () => {
    cy.mount(<LoadingSpinner className="" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-sm'])
  })

  it('handles undefined className', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-sm'])
  })

  it('has correct animation properties', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'animation-name', styles['ball-spin-clockwise'])
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'animation-duration', '1s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'animation-iteration-count', 'infinite')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).first().should('have.css', 'animation-timing-function', 'ease-in-out')
  })

  it('has correct positioning for all 8 balls', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).should('have.length', 8)
    cy.get(`.${styles['la-ball-spin-clockwise']} > div`).each(($el, index) => {
      cy.wrap($el).should('have.css', 'position', 'absolute')
      cy.wrap($el).should('have.css', 'border-radius', '100%')
    })
  })

  it('has different animation delays for each ball', () => {
    cy.mount(<LoadingSpinner />)
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(1)`).should('have.css', 'animation-delay', '-0.875s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(2)`).should('have.css', 'animation-delay', '-0.75s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(3)`).should('have.css', 'animation-delay', '-0.625s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(4)`).should('have.css', 'animation-delay', '-0.5s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(5)`).should('have.css', 'animation-delay', '-0.375s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(6)`).should('have.css', 'animation-delay', '-0.25s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(7)`).should('have.css', 'animation-delay', '-0.125s')
    cy.get(`.${styles['la-ball-spin-clockwise']} > div:nth-child(8)`).should('have.css', 'animation-delay', '0s')
  })

  it('handles dark theme with custom size', () => {
    cy.mount(<LoadingSpinner size="la-2x" dark />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-2x'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-dark'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '64px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '64px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(38, 38, 38)')
  })

  it('handles custom color with custom size', () => {
    cy.mount(<LoadingSpinner size="la-lg" color="#00ff00" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-lg'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '32px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '32px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(0, 255, 0)')
  })

  it('handles all props together', () => {
    cy.mount(<LoadingSpinner size="la-3x" dark={true} color="#0000ff" className="test-spinner" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-3x'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', styles['la-dark'])
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.class', 'test-spinner')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'width', '96px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'height', '96px')
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(0, 0, 255)')
  })

  it('handles edge case with empty color string', () => {
    cy.mount(<LoadingSpinner color="" />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    // Should fall back to default color
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(255, 255, 255)')
  })

  it('handles edge case with null color', () => {
    cy.mount(<LoadingSpinner color={null as any} />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    // Should fall back to default color
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(255, 255, 255)')
  })

  it('handles edge case with undefined color', () => {
    cy.mount(<LoadingSpinner color={undefined} />)
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('exist')
    // Should fall back to default color
    cy.get(`.${styles['la-ball-spin-clockwise']}`).should('have.css', 'color', 'rgb(255, 255, 255)')
  })
})
