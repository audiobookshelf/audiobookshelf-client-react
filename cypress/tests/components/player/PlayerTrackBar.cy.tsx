import PlayerTrackBar from '@/components/player/PlayerTrackBar'
import { LAZY_ACTIVATION_DELAY_MS } from '@/components/ui/Tooltip'
import type { PlayerHandler, PlayerHandlerControls, PlayerHandlerState } from '@/hooks/usePlayerHandler'
import { resetPlayerProgress, setPlayerProgress } from '@/lib/player/playerProgressStore'
import { PlayMethod, PlayerState, type Chapter } from '@/types/api'

const DEFAULT_SETTINGS: PlayerHandlerState['settings'] = {
  useChapterTrack: false,
  jumpForwardAmount: 10,
  jumpBackwardAmount: 10,
  playbackRate: 1,
  playbackRateIncrementDecrement: 0.1,
  volume: 0.5
}

function chapter(id: number, start: number, end: number, title: string): Chapter {
  return { id, start, end, title }
}

function createPlayerHandler(overrides: Partial<PlayerHandlerState> = {}): PlayerHandler {
  const seek = cy.stub().as('seek')
  const noop = cy.stub()

  const controls: PlayerHandlerControls = {
    load: noop,
    play: noop,
    pause: noop,
    playPause: noop,
    seek,
    jumpForward: noop,
    jumpBackward: noop,
    setVolume: noop,
    toggleMute: noop,
    setPlaybackRate: noop,
    incrementPlaybackRate: noop,
    decrementPlaybackRate: noop,
    updateSettings: noop,
    closePlayer: noop,
    getCurrentTime: () => 0
  }

  return {
    state: {
      playerState: PlayerState.PLAYING,
      duration: 600,
      transcodePercentReady: 1,
      volume: 0.5,
      isHlsTranscode: false,
      playMethod: PlayMethod.DIRECT_PLAY,
      sessionId: 'session-1',
      displayTitle: 'Normal Book',
      displayAuthor: 'Author',
      chapters: [],
      currentChapter: null,
      nextChapter: null,
      previousChapter: null,
      ...overrides,
      settings: { ...DEFAULT_SETTINGS, ...(overrides.settings ?? {}) }
    },
    controls
  }
}

const validChapters: Chapter[] = [
  chapter(0, 0, 60, 'Opening'),
  chapter(1, 60, 180, 'Chapter Two'),
  chapter(2, 180, 300, 'Chapter Three'),
  chapter(3, 300, 450, 'Chapter Four'),
  chapter(4, 450, 600, 'Finale')
]

function mountTrackBar(handler: PlayerHandler, widthClass = 'w-[400px]') {
  return cy.mount(
    <div cy-id="track-bar-preview" className={`bg-primary ${widthClass} p-8`}>
      <PlayerTrackBar playerHandler={handler} />
    </div>
  )
}

describe('<PlayerTrackBar /> chapter segments', () => {
  beforeEach(() => {
    resetPlayerProgress()
    setPlayerProgress(30, 120)
    cy.get('body').realHover({ position: 'topLeft' })
  })

  it('keeps the original progress bar when there are no chapters', () => {
    mountTrackBar(createPlayerHandler())
    cy.get('&chapter-segments').should('not.exist')
    cy.get('&chapter-segment').should('not.exist')
    cy.get('&chapter-boundary').should('not.exist')
    cy.get('&player-track').click('center')
    cy.get('@seek').should('have.been.calledOnce')
    cy.get('@seek').should('have.been.calledWithMatch', (time: number) => time > 250 && time < 350)
  })

  it('does not render a boundary dot at 00:00 but keeps the first chapter selectable', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }))
    cy.get('&chapter-segment').should('have.length', 5)
    cy.get('&chapter-segment').first().should('have.attr', 'data-chapter-number', '1').and('have.attr', 'data-chapter-start', '0')
    cy.get('&chapter-start').should('have.attr', 'aria-label', 'Chapter 1 - Opening')
    cy.get('&chapter-boundary').should('have.length', 4)
    cy.get('&chapter-boundary').then(($dots) => {
      const starts = [...$dots].map((el) => Number(el.getAttribute('data-chapter-start')))
      expect(starts).to.deep.equal([60, 180, 300, 450])
    })
  })

  it('places boundary dots inside the track at exact proportional positions', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }))
    cy.get('&player-track').then(($track) => {
      const trackTop = $track[0].getBoundingClientRect().top
      const trackBottom = $track[0].getBoundingClientRect().bottom
      cy.get('&chapter-boundary').each(($dot, index) => {
        const start = [60, 180, 300, 450][index]
        const segment = $dot.closest('[cy-id="chapter-segment"]')[0]
        expect(segment.style.left).to.equal(`${(start / 600) * 100}%`)
        const marker = $dot.find('span')[0]
        const rect = (marker ?? $dot[0]).getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        expect(centerY).to.be.within(trackTop, trackBottom)
        expect(rect.bottom).to.be.at.most(trackBottom + 1)
        expect(rect.top).to.be.at.least(trackTop - 1)
      })
    })
  })

  it('sizes each chapter segment from start to the next start', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }))
    const expected = [
      { start: 0, width: 60 / 600 },
      { start: 60, width: 120 / 600 },
      { start: 180, width: 120 / 600 },
      { start: 300, width: 150 / 600 },
      { start: 450, width: 150 / 600 }
    ]
    cy.get('&chapter-segment').each(($segment, index) => {
      expect($segment[0].style.left).to.equal(`${(expected[index].start / 600) * 100}%`)
      expect($segment[0].style.width).to.equal(`${expected[index].width * 100}%`)
    })
  })

  it('numbers chapters chronologically starting at 1', () => {
    mountTrackBar(
      createPlayerHandler({
        chapters: [chapter(9, 300, 600, 'Later'), chapter(1, 0, 60, 'Opening'), chapter(4, 60, 300, 'Middle')],
        duration: 600
      })
    )
    cy.get('&chapter-segment').then(($segments) => {
      const numbers = [...$segments].map((el) => el.getAttribute('data-chapter-number'))
      const starts = [...$segments].map((el) => el.getAttribute('data-chapter-start'))
      expect(numbers).to.deep.equal(['1', '2', '3'])
      expect(starts).to.deep.equal(['0', '60', '300'])
    })
  })

  it('ignores invalid and out-of-range chapter timestamps', () => {
    const chapters = [
      chapter(0, 0, 10, 'Opening'),
      chapter(1, Number.NaN, 20, 'NaN'),
      chapter(2, -5, 10, 'Negative'),
      chapter(3, 600, 700, 'At duration'),
      chapter(4, 900, 1000, 'Beyond'),
      chapter(5, 120, 200, 'Keep')
    ]
    mountTrackBar(createPlayerHandler({ chapters, duration: 600 }))
    cy.get('&chapter-segment').should('have.length', 2)
    cy.get('&chapter-segment').eq(0).should('have.attr', 'data-chapter-number', '1').and('have.attr', 'data-chapter-start', '0')
    cy.get('&chapter-segment').eq(1).should('have.attr', 'data-chapter-number', '2').and('have.attr', 'data-chapter-start', '120')
    cy.get('&chapter-boundary').should('have.length', 1).and('have.attr', 'data-chapter-start', '120')
  })

  it('shows tooltip text as Chapter {number} - {title}', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.get('&chapter-boundary').first().realHover()
    cy.get('&tooltip-floating', { timeout: LAZY_ACTIVATION_DELAY_MS + 1000 })
      .should('have.attr', 'aria-hidden', 'false')
      .and('contain.text', 'Chapter 2 - Chapter Two')
      .and('contain.text', '01:00')
  })

  it('shows only Chapter {number} when the title is empty', () => {
    mountTrackBar(createPlayerHandler({ chapters: [chapter(0, 0, 300, ''), chapter(1, 300, 600, 'Later')], duration: 600 }))
    cy.get('&chapter-start').should('have.attr', 'aria-label', 'Chapter 1')
    cy.get('&chapter-boundary').first().should('have.attr', 'aria-label', 'Chapter 2 - Later')
    cy.get('&chapter-start').realHover()
    cy.get('&tooltip-floating', { timeout: LAZY_ACTIVATION_DELAY_MS + 2000 })
      .should('have.attr', 'aria-hidden', 'false')
      .and('contain.text', 'Chapter 1')
      .and('not.contain.text', 'Chapter 1 -')
  })

  it('highlights only the hovered chapter segment', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.get('&chapter-segment').eq(1).realHover()
    cy.get('&chapter-segment')
      .eq(1)
      .find('[cy-id="chapter-segment-highlight"]')
      .should(($el) => {
        expect(getComputedStyle($el[0]).backgroundColor).to.not.equal('rgba(0, 0, 0, 0)')
      })
  })

  it('marks the chapter that contains the current playback position as active', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.get('&chapter-segment').eq(0).should('have.attr', 'data-active', 'true').and('have.attr', 'aria-current', 'true')
    cy.get('&chapter-segment').eq(1).should('have.attr', 'data-active', 'false')
  })

  it('seeks to the clicked position within the progress bar', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }))
    cy.get('&player-track').then(($track) => {
      const width = $track[0].getBoundingClientRect().width
      const height = $track[0].getBoundingClientRect().height
      cy.wrap($track).click(width * 0.25, height / 2)
    })
    cy.get('@seek').should('have.been.calledOnce')
    cy.get('@seek').should('have.been.calledWithMatch', (time: number) => time > 120 && time < 180)
  })

  it('seeks to the chapter start when a boundary marker is clicked', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }))
    cy.get('&chapter-boundary').eq(1).click()
    cy.get('@seek').should('have.been.calledOnceWith', 180)
  })

  it('seeks to the first chapter start from the keyboard', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.realPress('Tab')
    cy.get('&chapter-start').should('have.focus')
    cy.realPress('Enter')
    cy.get('@seek').should('have.been.calledOnceWith', 0)
  })

  it('activates a chapter boundary with Space', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.get('&chapter-boundary').first().focus()
    cy.realPress('Space')
    cy.get('@seek').should('have.been.calledOnceWith', 60)
  })

  it('shows the chapter tooltip on keyboard focus', () => {
    mountTrackBar(createPlayerHandler({ chapters: validChapters }))
    cy.realPress('Tab')
    cy.get('&chapter-start').should('have.focus')
    cy.get('&tooltip-floating', { timeout: LAZY_ACTIVATION_DELAY_MS + 1000 })
      .should('have.attr', 'aria-hidden', 'false')
      .and('contain.text', 'Chapter 1 - Opening')
  })

  it('does not show chapter segments in chapter-track mode', () => {
    mountTrackBar(
      createPlayerHandler({
        chapters: validChapters,
        settings: { ...DEFAULT_SETTINGS, useChapterTrack: true }
      })
    )
    cy.get('&chapter-segments').should('not.exist')
    cy.get('&player-track').click('center')
    cy.get('@seek').should('have.been.calledOnce')
  })

  it('keeps in-track markers at desktop and mobile widths', () => {
    cy.viewport(1280, 720)
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }), 'w-[720px]')
    cy.get('&chapter-segment').should('have.length', 5)
    cy.get('&chapter-boundary').should('have.length', 4)
    cy.get('&track-bar-preview').screenshot('chapter-segments-desktop')

    cy.viewport(390, 844)
    mountTrackBar(createPlayerHandler({ chapters: validChapters, duration: 600 }), 'w-[360px]')
    cy.get('&chapter-segment').should('have.length', 5)
    cy.get('&chapter-boundary').each(($dot, index) => {
      const start = [60, 180, 300, 450][index]
      const segment = $dot.closest('[cy-id="chapter-segment"]')[0]
      expect(segment.style.left).to.equal(`${(start / 600) * 100}%`)
    })
    cy.get('&track-bar-preview').screenshot('chapter-segments-mobile')
  })
})
