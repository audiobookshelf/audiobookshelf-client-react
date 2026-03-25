import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration, type FormatDurationOptions } from '@/lib/formatDuration'

function DurationProbe({ seconds, options }: { seconds: number; options?: FormatDurationOptions }) {
  const t = useTypeSafeTranslations()
  const text = formatDuration(seconds, t, options)
  return <span data-cy="duration-result">{text}</span>
}

describe('formatDuration', () => {
  const shareModalLike: FormatDurationOptions = {
    style: 'long',
    largestUnitOnly: true,
    showDays: true
  }

  const DAY = 86400
  const HOUR = 3600
  const MINUTE = 60
  const SECOND = 1

  it('default (no seconds): rounds 3d minus 1s up to 3 days', () => {
    cy.mount(<DurationProbe seconds={3 * DAY - SECOND} options={shareModalLike} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '3 days')
  })

  it('default (no seconds): rounds 1d minus 1s up to 1 day', () => {
    cy.mount(<DurationProbe seconds={DAY - SECOND} options={shareModalLike} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '1 day')
  })

  it('compact: hours and minutes', () => {
    cy.mount(<DurationProbe seconds={15 * HOUR + 8 * MINUTE} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '15h 8m')
  })

  it('compact: zero seconds', () => {
    cy.mount(<DurationProbe seconds={0} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '0m')
  })

  it('compact: zero seconds, showSeconds: true', () => {
    cy.mount(<DurationProbe seconds={0} options={{ showSeconds: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '0s')
  })

  it('long: zero seconds', () => {
    cy.mount(<DurationProbe seconds={0} options={{ style: 'long' }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '0 minutes')
  })

  it('long: zero seconds, showSeconds: true', () => {
    cy.mount(<DurationProbe seconds={0} options={{ style: 'long', showSeconds: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '0 seconds')
  })

  it('compact: seconds only', () => {
    cy.mount(<DurationProbe seconds={45} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '1m')
  })

  it('compact: seconds only, showSeconds: true', () => {
    cy.mount(<DurationProbe seconds={45} options={{ showSeconds: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '45s')
  })

  it('returns empty string for negative duration', () => {
    cy.mount(<DurationProbe seconds={-1} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '')
  })

  it('returns empty string for NaN', () => {
    cy.mount(<DurationProbe seconds={Number.NaN} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '')
  })

  it('long style with plural units', () => {
    cy.mount(<DurationProbe seconds={3661} options={{ style: 'long', showSeconds: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '1 hour 1 minute 1 second')
  })

  it('includeDays: splits at day boundary', () => {
    cy.mount(<DurationProbe seconds={90000} options={{ showDays: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '1d 1h')
  })

  it('without includeDays: total hours', () => {
    cy.mount(<DurationProbe seconds={90000} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '25h')
  })

  it('largestUnitOnly with includeDays', () => {
    cy.mount(<DurationProbe seconds={2 * 86400 + 3600} options={{ style: 'long', showDays: true, largestUnitOnly: true }} />)
    cy.get('[data-cy="duration-result"]').should('have.text', '2 days')
  })
})
