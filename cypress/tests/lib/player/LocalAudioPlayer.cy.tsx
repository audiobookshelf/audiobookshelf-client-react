import { LocalAudioPlayer } from '@/lib/player/LocalAudioPlayer'

describe('LocalAudioPlayer volume scaling', () => {
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
})
