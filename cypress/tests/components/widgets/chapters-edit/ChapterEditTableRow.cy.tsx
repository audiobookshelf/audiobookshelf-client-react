import ChapterEditTableRow from '@/components/widgets/chapters-edit/ChapterEditTableRow'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import type { ComponentProps } from 'react'

const mediaDuration = 3600

function makeChapter(partial: Partial<EditableChapter> & Pick<EditableChapter, 'id' | 'start'>): EditableChapter {
  return {
    end: partial.end ?? partial.start + 60,
    title: partial.title ?? `Chapter ${partial.id + 1}`,
    error: partial.error ?? null,
    clientKey: partial.clientKey ?? `ch-${partial.id}`,
    ...partial
  }
}

function mountRow(overrides: Partial<ComponentProps<typeof ChapterEditTableRow>> = {}) {
  const onStartChange = cy.spy().as('onStartChange')

  cy.mount(
    <table>
      <tbody>
        <ChapterEditTableRow
          chapter={makeChapter({ id: 0, start: 0, title: 'Intro' })}
          chapterCount={2}
          mediaDuration={mediaDuration}
          isFirstChapter={false}
          isChecked={false}
          isPlaySelected={false}
          isPlayingChapter={false}
          isLoadingChapter={false}
          elapsedTime={0}
          canPlay={true}
          startHeaderId="start-header"
          titleHeaderId="title-header"
          onCheckedChange={cy.stub()}
          onStartChange={onStartChange}
          onTitleDraft={cy.stub()}
          onTitleCommit={cy.stub()}
          onRemove={cy.stub()}
          onInsertBelow={cy.stub()}
          onPlay={cy.stub()}
          {...overrides}
        />
      </tbody>
    </table>
  )
}

describe('<ChapterEditTableRow /> first chapter timestamp', () => {
  it('disables the first row DurationPicker at 00:00:00', () => {
    mountRow({
      isFirstChapter: true,
      chapter: makeChapter({ id: 0, start: 0, title: 'Intro' })
    })

    cy.get('[cy-id="duration-picker-wrapper"] input').should('have.length', 3).and('be.disabled')
    cy.get('[cy-id="duration-picker-wrapper"] input').eq(0).should('have.value', '00')
    cy.get('[cy-id="duration-picker-wrapper"] input').eq(1).should('have.value', '00')
    cy.get('[cy-id="duration-picker-wrapper"] input').eq(2).should('have.value', '00')
    cy.get('[cy-id="duration-picker-wrapper"] input').eq(2).type('7', { force: true })
    cy.get('@onStartChange').should('not.have.been.called')
  })

  it('keeps a later-row DurationPicker editable', () => {
    mountRow({
      isFirstChapter: false,
      chapter: makeChapter({ id: 1, start: 90, title: 'Chapter 2' })
    })

    cy.get('[cy-id="duration-picker-wrapper"] input').should('not.be.disabled')
    cy.get('[cy-id="duration-picker-wrapper"] input').eq(2).focus().type('{uparrow}')
    cy.get('@onStartChange').should('have.been.called')
  })
})
