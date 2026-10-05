import { landscapeDensityFromShell, type LandscapeDensityFlags } from '@/lib/player/landscapeDensity'

describe('landscapeDensity', () => {
  it('compacts in order as the column budget shrinks', () => {
    const shell = document.createElement('div')
    const heights = [294, 246, 222, 196, 144]
    const tokens = ['--fs-col-0', '--fs-col-1', '--fs-col-2', '--fs-col-3', '--fs-col-4']
    heights.forEach((height, index) => shell.style.setProperty(tokens[index], `${height}px`))
    document.body.append(shell)

    const expectBudget = (budget: string, flags: LandscapeDensityFlags) => {
      shell.style.setProperty('--fs-col-budget', budget)
      expect(landscapeDensityFromShell(shell, true, true)).to.deep.equal(flags)
    }

    expectBudget('301px', {
      overflowSecondaryToolbar: false,
      singleTrackBar: false,
      chapterLabelBelow: false,
      compactTitle: false
    })
    expectBudget('251px', {
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: false,
      compactTitle: false
    })
    expectBudget('230px', {
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: false
    })
    expectBudget('200px', {
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: true
    })
    expectBudget('161px', {
      overflowSecondaryToolbar: true,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: true
    })

    shell.remove()
  })

  it('counts the chapter label above the book track when the book has chapters', () => {
    const shell = document.createElement('div')
    const heights = [294, 246, 222, 196, 144]
    const tokens = ['--fs-col-0', '--fs-col-1', '--fs-col-2', '--fs-col-3', '--fs-col-4']
    heights.forEach((height, index) => shell.style.setProperty(tokens[index], `${height}px`))
    shell.style.setProperty('--fs-col-book', '222px')
    shell.style.setProperty('--fs-col-budget', '222px')
    document.body.append(shell)

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

    shell.remove()
  })
})
