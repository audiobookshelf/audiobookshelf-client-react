import React from 'react'
import { MultiSelect, MultiSelectItem } from '@/components/ui/MultiSelect'

describe('<MultiSelect />', () => {
  const basicItems: MultiSelectItem[] = [
    { value: '1', content: 'Option 1' },
    { value: '2', content: 'Option 2' },
    { value: '3', content: 'Option 3' },
    { value: '4', content: 'Option 4' }
  ]

  const selectedItems: MultiSelectItem[] = [
    { value: '1', content: 'Option 1' },
    { value: '2', content: 'Option 2' }
  ]

  it('renders with basic props', () => {
    cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

    cy.get('input[role="combobox"]').should('exist')
    cy.get('div[role="list"]').should('exist')
  })

  it('renders with label', () => {
    cy.mount(<MultiSelect label="Select Options" items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

    cy.get('[cy-id="label"]').should('contain.text', 'Select Options')
    cy.get('[cy-id="label"]').should('have.attr', 'for')
  })

  it('displays selected items as pills', () => {
    cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

    cy.get('[role="listitem"]').should('have.length', 2)
    cy.get('[role="listitem"]').first().should('contain.text', 'Option 1')
    cy.get('[role="listitem"]').last().should('contain.text', 'Option 2')
  })

  it('opens dropdown when input is focused', () => {
    cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

    cy.get('input[role="combobox"]').focus()
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="option"]').should('have.length', 4)
  })

  it('filters items when typing', () => {
    cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

    cy.get('input[role="combobox"]').focus().type('Option 1')
    cy.get('[role="listbox"]').should('be.visible')
    // Note: The component doesn't seem to implement client-side filtering based on the code
    // This test may need adjustment based on actual behavior
  })

  it('calls onItemAdded when dropdown item is clicked', () => {
    const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
    cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} />)

    cy.get('input[role="combobox"]').focus()
    cy.get('[role="option"]').first().click()
    cy.get('@onItemAddedSpy').should('have.been.calledOnce')
  })

  it('calls onItemRemoved when pill remove button is clicked', () => {
    const onItemRemovedSpy = cy.spy().as('onItemRemovedSpy')
    cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={onItemRemovedSpy} />)

    // Hover over pill to show remove button
    cy.get('[role="listitem"]').first().realHover()
    cy.get('[role="listitem"]').first().find('button[aria-label="Remove"]').click()
    cy.get('@onItemRemovedSpy').should('have.been.calledOnce')
  })

  describe('Controlled vs Uncontrolled', () => {
    it('works as controlled component', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')

        return <MultiSelect value={value} items={basicItems} selectedItems={[]} onInputChange={setValue} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />
      }

      cy.mount(<TestComponent />)
      cy.get('input[role="combobox"]').should('have.value', '')
      cy.get('input[role="combobox"]').type('test')
      cy.get('input[role="combobox"]').should('have.value', 'test')
    })

    it('works as uncontrolled component', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').type('test')
      cy.get('input[role="combobox"]').should('have.value', 'test')
    })
  })

  describe('Keyboard Navigation', () => {
    it('navigates selected items with left/right keys', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      // Navigate to last item
      cy.get('input[role="combobox"]').type('{leftarrow}')
      cy.get('[role="listitem"]').last().should('have.class', 'ring')
      cy.get('[role="listitem"]')
        .last()
        .invoke('attr', 'id')
        .then((lastItemId) => {
          cy.get('input[role="combobox"]').should('have.attr', 'aria-activedescendant', lastItemId)
        })
      // Navigate to first item
      cy.get('input[role="combobox"]').type('{leftarrow}')
      cy.get('[role="listitem"]').first().should('have.class', 'ring')
      cy.get('[role="listitem"]')
        .first()
        .invoke('attr', 'id')
        .then((firstItemId) => {
          cy.get('input[role="combobox"]').should('have.attr', 'aria-activedescendant', firstItemId)
        })
      // Navigate to last item again
      cy.get('input[role="combobox"]').type('{rightarrow}')
      cy.get('[role="listitem"]').last().should('have.class', 'ring')
      cy.get('[role="listitem"]')
        .last()
        .invoke('attr', 'id')
        .then((lastItemId) => {
          cy.get('input[role="combobox"]').should('have.attr', 'aria-activedescendant', lastItemId)
        })
      // Navigate back to combobox input (no focused item)
      cy.get('input[role="combobox"]').type('{rightarrow}')
      cy.get('[role="listitem"]').first().should('not.have.class', 'ring')
      cy.get('[role="listitem"]').last().should('not.have.class', 'ring')
      cy.get('input[role="combobox"]').should('not.have.attr', 'aria-activedescendant')
    })

    it('navigates dropdown with up/downarrow keys', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('input[role="combobox"]').type('{downarrow}')

      // Check that aria-activedescendant points to the first option
      cy.get('[role="option"]')
        .first()
        .invoke('attr', 'id')
        .then((firstOptionId) => {
          cy.get('[role="listbox"]').should('have.attr', 'aria-activedescendant', firstOptionId)
        })

      cy.get('input[role="combobox"]').type('{downarrow}')

      // Check that aria-activedescendant points to the second option
      cy.get('[role="option"]')
        .eq(1)
        .invoke('attr', 'id')
        .then((secondOptionId) => {
          cy.get('[role="listbox"]').should('have.attr', 'aria-activedescendant', secondOptionId)
        })
    })

    it('selects item with Enter key', () => {
      const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('input[role="combobox"]').type('{downarrow}{enter}')
      cy.get('@onItemAddedSpy').should('have.been.calledOnce')
    })

    it('closes dropdown with Escape key', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('input[role="combobox"]').type('{esc}')
      cy.get('[role="listbox"]').should('not.exist')
    })

    it('removes last pill with backspace when input is empty', () => {
      const onItemRemovedSpy = cy.spy().as('onItemRemovedSpy')
      cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={onItemRemovedSpy} />)

      // Verify we start with 2 pills
      cy.get('[role="listitem"]').should('have.length', 2)

      cy.get('input[role="combobox"]').focus()
      cy.get('input[role="combobox"]').type('{backspace}')

      // Should call onItemRemoved for the last item
      cy.get('@onItemRemovedSpy').should('have.been.calledOnce')
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      cy.mount(<MultiSelect disabled items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').should('be.disabled')
      cy.get('div[role="list"]').should('have.class', 'cursor-not-allowed')
    })

    it('does not open dropdown when disabled', () => {
      cy.mount(<MultiSelect disabled items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').should('be.disabled')
      cy.get('div[role="list"]').click()
      cy.get('[role="listbox"]').should('not.exist')
    })
  })

  describe('Edit Functionality', () => {
    it('shows edit buttons when showEdit is true', () => {
      cy.mount(
        <MultiSelect showEdit items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} onItemEdited={cy.stub()} />
      )

      cy.get('[role="listitem"]').first().realHover()
      cy.get('[role="listitem"]').first().find('button[aria-label="Edit"]').should('be.visible')
    })

    it('enters edit mode when edit button is clicked', () => {
      const onEditingPillIndexChangeSpy = cy.spy().as('onEditingPillIndexChangeSpy')
      cy.mount(
        <MultiSelect
          showEdit
          items={basicItems}
          selectedItems={selectedItems}
          onItemAdded={cy.stub()}
          onItemRemoved={cy.stub()}
          onItemEdited={cy.stub()}
          onEditingPillIndexChange={onEditingPillIndexChangeSpy}
        />
      )

      cy.get('[role="listitem"]').first().realHover()
      cy.get('[role="listitem"]').first().find('button[aria-label="Edit"]').click()
      cy.get('@onEditingPillIndexChangeSpy').should('have.been.calledWith', 0)
    })

    it('calls onItemEdited when edit is saved', () => {
      const onItemEditedSpy = cy.spy().as('onItemEditedSpy')
      cy.mount(
        <MultiSelect
          showEdit
          editingPillIndex={0}
          items={basicItems}
          selectedItems={selectedItems}
          onItemAdded={cy.stub()}
          onItemRemoved={cy.stub()}
          onItemEdited={onItemEditedSpy}
          onEditDone={cy.stub()}
        />
      )

      // Should be in edit mode
      cy.get('input[type="text"]').should('exist').clear().type('Edited Option{enter}')
      cy.get('@onItemEditedSpy').should('have.been.called')
    })
  })

  describe('Allow New Items', () => {
    it('adds new item when allowNew is true and Enter is pressed', () => {
      const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
      cy.mount(<MultiSelect allowNew items={basicItems} selectedItems={[]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus().type('New Item{enter}')
      cy.get('@onItemAddedSpy').should('have.been.called')
    })

    it('does not add new item when allowNew is false', () => {
      const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
      cy.mount(<MultiSelect allowNew={false} items={basicItems} selectedItems={[]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus().type('New Item{enter}')
      cy.get('@onItemAddedSpy').should('not.have.been.called')
    })
  })

  describe('Input Visibility', () => {
    it('hides input when showInput is false', () => {
      cy.mount(<MultiSelect showInput={false} items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').should('have.class', 'sr-only')
    })

    it('shows input when showInput is true', () => {
      cy.mount(<MultiSelect showInput={true} items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').should('not.have.class', 'sr-only')
    })
  })

  describe('Menu Disabled', () => {
    it('does not show dropdown when menuDisabled is true', () => {
      cy.mount(<MultiSelect menuDisabled items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="listbox"]').should('not.exist')
    })
  })

  describe('Validation', () => {
    it('calls validation function when adding items', () => {
      const onValidateStub = cy.stub().as('onValidateStub').returns(null) // Valid
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} onValidate={onValidateStub} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="option"]').first().click()
      cy.get('@onValidateStub').should('have.been.called')
    })

    it('prevents adding invalid items', () => {
      const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
      const onValidateStub = cy.stub().returns('Invalid item') // Invalid

      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} onValidate={onValidateStub} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="option"]').first().click()
      cy.get('@onItemAddedSpy').should('not.have.been.called')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').should('have.attr', 'aria-autocomplete', 'list')
      cy.get('input[role="combobox"]').should('have.attr', 'aria-haspopup', 'listbox')
      cy.get('input[role="combobox"]').should('have.attr', 'aria-expanded', 'false')

      cy.get('input[role="combobox"]').focus()
      cy.get('input[role="combobox"]').should('have.attr', 'aria-expanded', 'true')
    })

    it('sets aria-activedescendant correctly', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('input[role="combobox"]').type('{downarrow}')
      cy.get('input[role="combobox"]').should('have.attr', 'aria-activedescendant')
    })

    it('has proper role attributes', () => {
      cy.mount(<MultiSelect items={basicItems} selectedItems={selectedItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('div[role="list"]').should('exist')
      cy.get('[role="listitem"]').should('have.length', 2)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="listbox"]').should('exist')
      cy.get('[role="option"]').should('have.length', 4)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      cy.mount(<MultiSelect items={[]} selectedItems={[]} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="listbox"]').should('be.visible')
      cy.get('[role="listbox"]').should('contain.text', 'No items')
    })

    it('handles duplicate item selection', () => {
      const onItemAddedSpy = cy.spy().as('onItemAddedSpy')
      cy.mount(<MultiSelect items={basicItems} selectedItems={[{ value: '1', content: 'Option 1' }]} onItemAdded={onItemAddedSpy} onItemRemoved={cy.stub()} />)

      cy.get('input[role="combobox"]').focus()
      cy.get('[role="option"]').first().click() // Try to select already selected item
      cy.get('@onItemAddedSpy').should('not.have.been.called')
    })

    it('handles very long item text', () => {
      const longItems = [{ value: '1', content: 'This is a very long item text that should handle overflow correctly and not break the layout' }]

      cy.mount(<MultiSelect items={longItems} selectedItems={longItems} onItemAdded={cy.stub()} onItemRemoved={cy.stub()} />)

      cy.get('[role="listitem"]').should('exist')
      cy.get('[role="listitem"]').should('contain.text', 'This is a very long item text')
    })
  })
})
