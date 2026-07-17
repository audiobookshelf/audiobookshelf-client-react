import Btn from '@/components/ui/Btn'
import Tooltip, { LAZY_ACTIVATION_DELAY_MS, TooltipCore, type TooltipCoreProps, type TooltipProps } from '@/components/ui/Tooltip'

type MountTooltipOptions = Partial<TooltipProps> & {
  triggerLabel?: string
  showOutsideButton?: boolean
}

type MountTooltipCoreOptions = Partial<TooltipCoreProps> &
  MountTooltipOptions & {
    /** Use a non-focusable child so Tab can reach the reference when addTabIndex is set. */
    nonFocusableChild?: boolean
  }

function mountTooltip({ triggerLabel = 'Trigger', showOutsideButton = false, text = 'Tooltip text', ...tooltipProps }: MountTooltipOptions = {}) {
  return cy.mount(
    <div className="p-8">
      <Tooltip text={text} {...tooltipProps}>
        <button type="button" cy-id="tooltip-trigger">
          {triggerLabel}
        </button>
      </Tooltip>
      {showOutsideButton && (
        <button type="button" cy-id="outside-button">
          Outside
        </button>
      )}
    </div>
  )
}

function mountTooltipCore({
  triggerLabel = 'Trigger',
  showOutsideButton = false,
  nonFocusableChild = false,
  text = 'Tooltip text',
  ...tooltipProps
}: MountTooltipCoreOptions = {}) {
  return cy.mount(
    <div className="p-8">
      <TooltipCore text={text} {...tooltipProps}>
        {nonFocusableChild ? (
          <span cy-id="tooltip-child">{triggerLabel}</span>
        ) : (
          <button type="button" cy-id="tooltip-trigger">
            {triggerLabel}
          </button>
        )}
      </TooltipCore>
      {showOutsideButton && (
        <button type="button" cy-id="outside-button">
          Outside
        </button>
      )}
    </div>
  )
}

const getTooltip = (options?: Partial<Cypress.Timeoutable>) => cy.get('&tooltip-floating', options)
const getReference = () => cy.get('&tooltip-reference')
const getTrigger = () => cy.get('&tooltip-trigger')
const getOutsideButton = () => cy.get('&outside-button')
const getArrow = () => cy.get('&tooltip-arrow')

function assertTooltipOpen(expectedText = 'Tooltip text', options?: Partial<Cypress.Timeoutable>) {
  getTooltip(options).should('exist').and('have.attr', 'aria-hidden', 'false').and('have.class', 'opacity-100').and('contain.text', expectedText)
}

function assertTooltipClosed(lazyWhileClosed = false) {
  if (lazyWhileClosed) {
    getTooltip().should('not.exist')
    return
  }

  getTooltip().should('exist').and('have.attr', 'aria-hidden', 'true').and('have.class', 'opacity-0')
}

describe('<Tooltip />', () => {
  beforeEach(() => {
    cy.get('body').realHover({ position: 'topLeft' })
  })

  describe('rendering', () => {
    it('renders a closed tooltip by default', () => {
      mountTooltip()
      getTooltip().should('exist')
      assertTooltipClosed()
    })

    it('uses a div reference by default', () => {
      mountTooltip()
      getReference().should('match', 'div')
    })

    it('renders the arrow', () => {
      mountTooltip()
      getReference().realHover()
      getArrow().should('exist')
    })

    it('portals to document.body', () => {
      mountTooltip()
      getReference().realHover()
      getTooltip().parents('body').should('exist')
    })

    it('sets aria-describedby on the first child element', () => {
      mountTooltip()
      getTooltip()
        .invoke('attr', 'id')
        .then((tooltipId) => {
          getTrigger().should('have.attr', 'aria-describedby', tooltipId)
        })
    })
  })

  describe('hover interactions', () => {
    it('opens on realHover immediately by default', () => {
      mountTooltip()
      assertTooltipClosed()
      getReference().realHover()
      assertTooltipOpen()
    })

    it('closes after mouse leave with the hide delay', () => {
      mountTooltip()
      getReference().realHover()
      assertTooltipOpen()
      cy.get('body').realHover({ position: 'topLeft' })
      cy.wait(150)
      assertTooltipClosed()
    })

    it('waits for the lazy activation delay before opening', () => {
      cy.clock().as('activationClock')
      mountTooltip({ lazy: true })
      cy.tick(0)
      getReference().trigger('mouseover')
      assertTooltipClosed(true)
      cy.tick(LAZY_ACTIVATION_DELAY_MS)
      cy.get('@activationClock').invoke('restore')
      assertTooltipOpen('Tooltip text', { timeout: 5000 })
    })

    it('cancels a pending lazy open when the pointer leaves before the delay', () => {
      cy.clock().as('activationClock')
      mountTooltipCore({ lazy: true, activateOnFocus: false })
      cy.tick(0)
      getReference().trigger('mouseover')
      cy.tick(50)
      getReference().trigger('mouseout')
      cy.tick(LAZY_ACTIVATION_DELAY_MS + 50)
      assertTooltipClosed(true)
      cy.get('@activationClock').invoke('restore')
    })
  })

  describe('pointer interactions', () => {
    it('dismisses an open hover tooltip on pointerdown', () => {
      mountTooltip()
      getReference().realHover()
      assertTooltipOpen()
      getTrigger().realClick()
      assertTooltipClosed()
    })
  })

  describe('keyboard interactions', () => {
    it('dismisses an open tooltip on Escape', () => {
      mountTooltip()
      getReference().realHover()
      assertTooltipOpen()
      cy.realPress('Escape')
      assertTooltipClosed()
    })
  })

  describe('lazy unmount', () => {
    it('unmounts the floating element after close when lazy is true', () => {
      mountTooltipCore({ lazy: true, activateOnFocus: false })
      getReference().realHover()
      assertTooltipOpen()
      cy.realPress('Escape')
      cy.wait(200)
      getTooltip().should('not.exist')
    })
  })

  describe('positions and styling props', () => {
    const positions = ['top', 'bottom', 'left', 'right'] as const

    positions.forEach((position) => {
      it(`renders with position="${position}"`, () => {
        mountTooltip({ position })
        getReference().realHover()
        assertTooltipOpen()
      })
    })

    it('works with a real Btn child', () => {
      cy.mount(
        <Tooltip text="Button tooltip">
          <Btn>Hover me</Btn>
        </Tooltip>
      )
      cy.get('button').realHover()
      assertTooltipOpen('Button tooltip')
    })
  })
})

describe('<TooltipCore />', () => {
  beforeEach(() => {
    cy.get('body').realHover({ position: 'topLeft' })
  })

  describe('wrapper interactions', () => {
    it('does not render the floating element when disabled', () => {
      mountTooltipCore({ disabled: true })
      getTooltip().should('not.exist')
    })

    it('does not open on hover when disabled', () => {
      mountTooltipCore({ disabled: true })
      getReference().realHover()
      getTooltip().should('not.exist')
    })

    it('applies className to the reference wrapper', () => {
      mountTooltipCore({
        className: 'custom-reference',
        tooltipClassName: 'custom-tooltip'
      })
      getReference().should('have.class', 'custom-reference')
      getReference().realHover()
      getTooltip().should('have.class', 'custom-tooltip')
    })

    it('uses a span reference when inline is true', () => {
      cy.mount(
        <TooltipCore text="Inline tooltip" inline>
          <span cy-id="inline-child">Child</span>
        </TooltipCore>
      )
      cy.get('&tooltip-reference').should('match', 'span')
      cy.get('[cy-id="inline-child"]').parent('[cy-id="tooltip-reference"]').should('exist')
    })

    it('does not open on hover when openOnClick is true', () => {
      mountTooltipCore({ openOnClick: true })
      getReference().realHover()
      assertTooltipClosed()
    })

    it('toggles open state when openOnClick is true', () => {
      mountTooltipCore({ openOnClick: true })
      getTrigger().realClick()
      assertTooltipOpen()
      getTrigger().realClick()
      assertTooltipClosed()
    })

    it('dismisses openOnClick tooltips on outside pointerdown', () => {
      mountTooltipCore({ openOnClick: true, showOutsideButton: true })
      getTrigger().realClick()
      assertTooltipOpen()
      getOutsideButton().realClick()
      assertTooltipClosed()
    })

    it('closes on click when closeOnClick is true', () => {
      mountTooltipCore({ closeOnClick: true })
      getReference().realHover()
      assertTooltipOpen()
      getTrigger().realClick()
      assertTooltipClosed()
    })

    it('opens on Tab focus when activateOnFocus is true and addTabIndex is set', () => {
      mountTooltipCore({ addTabIndex: true, activateOnFocus: true, nonFocusableChild: true })
      assertTooltipClosed()
      cy.realPress('Tab')
      getReference().should('have.focus')
      assertTooltipOpen()
    })

    it('closes on blur when activateOnFocus is true', () => {
      mountTooltipCore({ addTabIndex: true, activateOnFocus: true, nonFocusableChild: true })
      cy.realPress('Tab')
      assertTooltipOpen()
      cy.get('body').click(0, 0)
      assertTooltipClosed()
    })

    it('does not open on Tab focus when activateOnFocus is false', () => {
      mountTooltipCore({ addTabIndex: true, activateOnFocus: false, nonFocusableChild: true })
      cy.realPress('Tab')
      getReference().should('have.focus')
      assertTooltipClosed()
    })

    it('toggles on Enter when activateOnFocus is true and the reference is focused', () => {
      mountTooltipCore({ addTabIndex: true, activateOnFocus: true, nonFocusableChild: true })
      cy.realPress('Tab')
      assertTooltipOpen()
      getReference().trigger('click', { detail: 0 })
      assertTooltipClosed()
      getReference().trigger('click', { detail: 0 })
      assertTooltipOpen()
    })

    it('opens when a focusable child receives keyboard focus', () => {
      mountTooltipCore({ activateOnFocus: true })
      getTrigger().focus()
      assertTooltipOpen()
    })
  })
})
