import { landscapeDensityFlags, LANDSCAPE_DENSITY_MAX_LEVEL, rightColumnContentOverflows } from '@/lib/player/landscapeDensity'

describe('landscapeDensity', () => {
  it('applies compaction steps in A → B → C → D order', () => {
    expect(landscapeDensityFlags(0)).to.deep.equal({
      overflowSecondaryToolbar: false,
      singleTrackBar: false,
      chapterLabelBelow: false,
      compactTitle: false
    })
    expect(landscapeDensityFlags(1)).to.deep.equal({
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: false,
      compactTitle: false
    })
    expect(landscapeDensityFlags(2)).to.deep.equal({
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: false
    })
    expect(landscapeDensityFlags(3)).to.deep.equal({
      overflowSecondaryToolbar: false,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: true
    })
    expect(landscapeDensityFlags(LANDSCAPE_DENSITY_MAX_LEVEL)).to.deep.equal({
      overflowSecondaryToolbar: true,
      singleTrackBar: true,
      chapterLabelBelow: true,
      compactTitle: true
    })
  })

  it('detects overflow when flex-shrink squashes a section or its content', () => {
    const column = document.createElement('div')
    column.style.display = 'flex'
    column.style.flexDirection = 'column'
    column.style.gap = '8px'
    column.style.height = '120px'
    column.style.overflow = 'hidden'

    const title = document.createElement('div')
    title.style.flexShrink = '1'
    title.style.minHeight = '0'
    title.style.overflow = 'hidden'
    const titleInner = document.createElement('div')
    titleInner.style.height = '60px'
    title.append(titleInner)

    const tracks = document.createElement('div')
    tracks.style.height = '80px'
    tracks.style.flexShrink = '0'

    column.append(title, tracks)
    document.body.append(column)

    expect(title.clientHeight).to.be.lessThan(titleInner.offsetHeight)
    expect(rightColumnContentOverflows(column)).to.equal(true)

    column.remove()
  })
})
