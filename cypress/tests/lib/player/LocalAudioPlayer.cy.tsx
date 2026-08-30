import { AudioTrack } from '@/lib/player/AudioTrack'
import { LocalAudioPlayer } from '@/lib/player/LocalAudioPlayer'

/** Two adjacent 100s tracks, so global time 100 is the boundary between them. */
function twoTracks(): AudioTrack[] {
  return [
    new AudioTrack({ index: 1, startOffset: 0, duration: 100, title: 'Track 1', contentUrl: '/track/1', mimeType: 'audio/mpeg' }),
    new AudioTrack({ index: 2, startOffset: 100, duration: 100, title: 'Track 2', contentUrl: '/track/2', mimeType: 'audio/mpeg' })
  ]
}

function stubElement($audio: HTMLAudioElement, { paused = false } = {}) {
  cy.stub($audio, 'load')
  const play = cy.stub($audio, 'play').resolves()
  Object.defineProperty($audio, 'currentTime', { configurable: true, writable: true, value: 0 })
  Object.defineProperty($audio, 'paused', { configurable: true, writable: true, value: paused })
  return play
}

describe('LocalAudioPlayer', () => {
  let player: LocalAudioPlayer

  beforeEach(() => {
    cy.mount(<div />)
    cy.then(() => {
      player = new LocalAudioPlayer()
    })
  })

  afterEach(() => {
    cy.then(() => {
      player.destroy()
    })
  })

  it('applies a quadratic curve to the audio element volume', () => {
    cy.then(() => player.setVolume(0))
    cy.get<HTMLAudioElement>('#audio-player').should('have.prop', 'volume', 0)

    cy.then(() => player.setVolume(0.5))
    cy.get<HTMLAudioElement>('#audio-player').should('have.prop', 'volume', 0.25)

    cy.then(() => player.setVolume(1))
    cy.get<HTMLAudioElement>('#audio-player').should('have.prop', 'volume', 1)
  })

  it('keeps the requested global time while a track change is loading', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      stubElement($audio[0])

      player.set(null, tracks, false, 105)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      player.seek(95, false)

      expect(player.getCurrentTime()).to.equal(95)
    })
  })

  it('loads the next track when seeking to an exact track boundary', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      stubElement($audio[0])

      player.set(null, tracks, false, 50)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      player.seek(100, false)

      expect($audio[0].src).to.include('/track/2')
      expect(player.getCurrentTime()).to.equal(100)
    })
  })

  it('does not start playback when seeking across tracks while paused', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      const playStub = stubElement($audio[0], { paused: true })

      player.set(null, tracks, false, 150, true)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      $audio[0].dispatchEvent(new Event('seeked'))
      playStub.resetHistory()

      // Now paused, seek back into track 1: playback must not resume
      player.seek(50, false)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      $audio[0].dispatchEvent(new Event('seeked'))

      expect(playStub.called).to.equal(false)
    })
  })

  it('seeks to the end of the book within the final track', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      stubElement($audio[0])

      player.set(null, tracks, false, 50)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      // The very end of the book is inside no track's half-open range
      player.seek(200, false)

      expect($audio[0].src).to.include('/track/2')
      expect(player.getCurrentTime()).to.equal(200)

      player.seek(250, false)
      expect(player.getCurrentTime()).to.equal(200)
    })
  })

  it('does not touch the element when play is pressed during a cross-track load', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      const playStub = stubElement($audio[0])

      player.set(null, tracks, false, 150)
      playStub.resetHistory()

      // Metadata has not arrived yet, so the load is still in flight
      player.play()
      expect(playStub.called).to.equal(false)

      // Once the load completes and the seek lands, playback resumes
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      $audio[0].dispatchEvent(new Event('seeked'))
      expect(playStub.called).to.equal(true)
    })
  })

  it('plays once the load finishes when play is pressed during a paused cross-track seek', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      const playStub = stubElement($audio[0], { paused: true })

      // Paused cross-track load whose post-load seek has not landed yet
      player.set(null, tracks, false, 150)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      playStub.resetHistory()

      // The user presses play while the load is still in flight
      player.play()
      expect(playStub.called).to.equal(false)

      $audio[0].dispatchEvent(new Event('seeked'))
      expect(playStub.called).to.equal(true)
    })
  })

  it('keeps playing into the next track when one finishes naturally', () => {
    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      const playStub = stubElement($audio[0])
      const tracks = twoTracks()

      player.set(null, tracks, false, 0, true)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      playStub.resetHistory()

      // The element reports paused before firing 'ended', so intent must come from playWhenReady
      Object.defineProperty($audio[0], 'paused', { configurable: true, writable: true, value: true })
      $audio[0].dispatchEvent(new Event('ended'))
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      expect($audio[0].src).to.include('/track/2')
      expect(playStub.called).to.equal(true)
    })
  })

  it('stays paused when a track ends after the user paused', () => {
    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      const playStub = stubElement($audio[0], { paused: true })
      const tracks = twoTracks()

      player.set(null, tracks, false, 0, true)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      player.pause()
      playStub.resetHistory()

      $audio[0].dispatchEvent(new Event('ended'))
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      expect($audio[0].src).to.include('/track/2')
      expect(playStub.called).to.equal(false)
    })
  })

  it('does not resolve a time between non-contiguous tracks to the final track', () => {
    const gappedTracks = [
      new AudioTrack({ index: 1, startOffset: 0, duration: 100, title: 'Track 1', contentUrl: '/track/1', mimeType: 'audio/mpeg' }),
      new AudioTrack({ index: 2, startOffset: 200, duration: 100, title: 'Track 2', contentUrl: '/track/2', mimeType: 'audio/mpeg' })
    ]

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      stubElement($audio[0])

      player.set(null, gappedTracks, false, 50)
      $audio[0].dispatchEvent(new Event('loadedmetadata'))

      // 150 falls in the gap, so it must not jump to the last track
      player.seek(150, false)

      expect($audio[0].src).to.include('/track/1')
    })
  })

  it('retargets a same-track seek issued while the track is still loading', () => {
    const tracks = twoTracks()

    cy.get<HTMLAudioElement>('#audio-player').then(($audio) => {
      stubElement($audio[0])

      player.set(null, tracks, false, 105)

      // Track 2 is still loading (no loadedmetadata yet); seek within it
      player.seek(110, false)
      expect(player.getCurrentTime()).to.equal(110)

      // Metadata arrives: the load must land on the retargeted position, not the original 105
      $audio[0].dispatchEvent(new Event('loadedmetadata'))
      expect($audio[0].currentTime).to.equal(10)
      expect(player.getCurrentTime()).to.equal(110)
    })
  })
})
