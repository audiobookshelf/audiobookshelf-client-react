import '@/components/player/player-shell.css'
import { SHELL, layoutClass } from '@/components/player/playerShellClasses'
import { landscapeDensityFromShell } from '@/lib/player/landscapeDensity'
import { CSSProperties } from 'react'

function LandscapeShell() {
  return <div data-cy="player-shell" className={layoutClass(SHELL, 'landscape')} style={{ '--safe-top': '59px', '--safe-bottom': '21px' } as CSSProperties} />
}

describe('landscape player shell insets', () => {
  it('drops the portrait top inset in short landscape and keeps the home-indicator bottom inset', () => {
    cy.viewport(844, 390)
    cy.mount(<LandscapeShell />)

    cy.get('[data-cy="player-shell"]').should(($shell) => {
      const shell = $shell[0] as HTMLElement
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const style = getComputedStyle(shell)
      expect(parseFloat(style.paddingTop)).to.be.closeTo(0.5 * rootFontSize, 0.5)
      expect(parseFloat(style.paddingBottom)).to.be.closeTo(rootFontSize + 21, 0.5)
      expect(shell.style.height).to.equal('')
      expect(shell.style.top).to.equal('')
    })
  })

  it('resolves the chapter-track column tokens against the visible height', () => {
    cy.viewport(700, 340)
    cy.mount(<LandscapeShell />)

    cy.get('[data-cy="player-shell"]').should(($shell) => {
      const shell = $shell[0] as HTMLElement
      expect(landscapeDensityFromShell(shell, true, true)).to.deep.equal({
        overflowSecondaryToolbar: false,
        singleTrackBar: true,
        chapterLabelBelow: false,
        compactTitle: false
      })
      expect(landscapeDensityFromShell(shell, false, false)).to.deep.equal({
        overflowSecondaryToolbar: false,
        singleTrackBar: false,
        chapterLabelBelow: false,
        compactTitle: false
      })
    })
  })

  it('makes room for the chapter label above the book track at Brave iOS landscape height', () => {
    cy.viewport(844, 310)
    cy.mount(<LandscapeShell />)

    cy.get('[data-cy="player-shell"]').should(($shell) => {
      const shell = $shell[0] as HTMLElement
      expect(landscapeDensityFromShell(shell, false, true)).to.deep.equal({
        overflowSecondaryToolbar: false,
        singleTrackBar: true,
        chapterLabelBelow: true,
        compactTitle: false
      })
      expect(landscapeDensityFromShell(shell, false, false)).to.deep.equal({
        overflowSecondaryToolbar: false,
        singleTrackBar: false,
        chapterLabelBelow: false,
        compactTitle: false
      })
    })
  })

  it('keeps the top safe-area inset in portrait', () => {
    cy.viewport(390, 844)
    cy.mount(<LandscapeShell />)

    cy.get('[data-cy="player-shell"]').should(($shell) => {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const paddingTop = parseFloat(getComputedStyle($shell[0]).paddingTop)
      expect(paddingTop).to.be.closeTo(0.5 * rootFontSize + 59, 0.5)
    })
  })
})
