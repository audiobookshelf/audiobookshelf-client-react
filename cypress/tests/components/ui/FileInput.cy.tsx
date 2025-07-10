import React from 'react'
import FileInput from '@/components/ui/FileInput'

describe('<FileInput />', () => {

  const file1 = {
    contents: Cypress.Buffer.from('jpg test'),
    fileName: 'test.jpg',
    mimeType: 'image/jpeg',
    lastModified: 1715404800000
  }

  const file1Output = {
    name: 'test.jpg',
    type: 'image/jpeg',
    lastModified: 1715404800000,
    size: 8
  }

  const file2 = {
    contents: Cypress.Buffer.from('json test'),
    fileName: 'test.json',
    mimeType: 'application/json',
    lastModified: 1715404800000
  }
  
  const file2Output = {
    name: 'test.json',
    type: 'application/json',
    lastModified: 1715404800000,
    size: 9
  }

  it('renders a basic file input', () => {
    cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
    cy.get('input[type="file"]').should('exist')
    cy.get('input[type="file"]').should('have.class', 'hidden')
    cy.get('button').should('contain.text', 'Choose File')
    cy.get('button').should('have.class', 'hidden')
    cy.get('button').should('have.class', 'md:block')
  })

  it('renders mobile icon button', () => {
    cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
    cy.get('[cy-id="icon-btn-icon"]').should('exist')
    cy.get('button').last().should('have.class', 'block')
    cy.get('button').last().should('have.class', 'md:hidden')
  })

  it('applies default accept attribute', () => {
    cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
    cy.get('input[type="file"]').should('have.attr', 'accept', '.png, .jpg, .jpeg, .webp')
  })

  it('applies custom accept attribute', () => {
    cy.mount(
      <FileInput accept=".pdf,.doc,.docx" onChange={() => {}}>
        Upload Document
      </FileInput>
    )
    cy.get('input[type="file"]').should('have.attr', 'accept', '.pdf,.doc,.docx')
  })

  it('calls onChange handler when file is selected', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(<FileInput onChange={onChangeSpy}>Choose File</FileInput>)

    cy.get('input[type="file"]').selectFile(file1, {force: true})
    cy.get('@onChangeSpy').should('have.been.calledWithMatch', file1Output)
  })

  it('applies custom className to container', () => {
    cy.mount(
      <FileInput onChange={() => {}} className="custom-container-class">
        Choose File
      </FileInput>
    )
    cy.get('div').should('have.class', 'custom-container-class')
  })

  it('handles empty className prop', () => {
    cy.mount(<FileInput onChange={() => {}} className="">Choose File</FileInput>)
    cy.get('div').should('have.class', '')
  })

  it('handles undefined className prop', () => {
    cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
    cy.get('div').should('have.class', '')
  })

  it('handles complex children content', () => {
    cy.mount(
      <FileInput onChange={() => {}}>
        <span>Upload</span>
        <span>File</span>
      </FileInput>
    )
    cy.get('button').should('contain.text', 'Upload')
    cy.get('button').should('contain.text', 'File')
  })

  it('handles different file types', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(
      <FileInput accept=".png,.jpg,.jpeg,.gif" onChange={onChangeSpy}>
        Upload Image
      </FileInput>
    )
    
    cy.get('input[type="file"]').should('have.attr', 'accept', '.png,.jpg,.jpeg,.gif')
  })

  it('handles all file types', () => {
    cy.mount(
      <FileInput accept="*" onChange={() => {}}>
        Choose Any File
      </FileInput>
    )
    
    cy.get('input[type="file"]').should('have.attr', 'accept', '*')
  })

  it('handles optional onChange prop', () => {
    cy.mount(<FileInput onChange={undefined}>Choose File</FileInput>)
    
    // Should render without errors even without onChange
    cy.get('input[type="file"]').should('exist')
    cy.get('button').should('exist')
    cy.get('[cy-id="icon-btn-icon"]').should('exist')
  })

  it('handles multiple class names in className prop', () => {
    cy.mount(
      <FileInput onChange={() => {}} className="class1 class2 class3">
        Choose File
      </FileInput>
    )
    cy.get('div').should('have.class', 'class1')
    cy.get('div').should('have.class', 'class2')
    cy.get('div').should('have.class', 'class3')
  })

  it('maintains responsive design', () => {
    cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
    
    // Desktop button should be hidden on mobile
    cy.get('button').first().should('have.class', 'hidden')
    cy.get('button').first().should('have.class', 'md:block')
    
    // Mobile icon should be visible on mobile
    cy.get('button').last().should('have.class', 'block')
    cy.get('button').last().should('have.class', 'md:hidden')
  })

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes on file input', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      cy.get('input[type="file"]').should('have.attr', 'aria-label', 'Choose file')
      cy.get('input[type="file"]').should('have.attr', 'tabindex', '-1')
    })

    it('has proper ARIA attributes on desktop button', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Check that the button exists (may be hidden on mobile viewport)
      cy.get('button').first().should('exist')
      cy.get('button').first().should('have.attr', 'aria-label', 'Choose file')
    })

    it('has proper ARIA attributes on mobile icon button', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Check that the icon button exists and has proper aria-label
      cy.get('button').last().should('exist')
      cy.get('button').last().should('have.attr', 'aria-label', 'Choose file')
    })

    it('supports custom aria-label', () => {
      cy.mount(
        <FileInput onChange={() => {}} ariaLabel="Upload profile picture">
          Choose File
        </FileInput>
      )
      
      cy.get('input[type="file"]').should('have.attr', 'aria-label', 'Upload profile picture')
      cy.get('button').last().should('have.attr', 'aria-label', 'Upload profile picture')
    })

    it('generates unique ID for file input', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      cy.get('input[type="file"]').should('have.attr', 'id')
      cy.get('input[type="file"]').invoke('attr', 'id').should('match', /^file-input-/)
    })

    it('announces file selection to screen readers', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Initially no live region should exist
      cy.get('[aria-live="polite"]').should('not.exist')
      
      // Select a file
      cy.get('input[type="file"]').selectFile(file1, {force: true})
      
      // Live region should appear with announcement
      cy.get('[aria-live="polite"]').should('exist')
      cy.get('[aria-live="polite"]').should('contain.text', 'Selected file: test.jpg')
      cy.get('[aria-live="polite"]').should('have.attr', 'aria-atomic', 'true')
    })

    it('announces different file selections', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Select first file
      cy.get('input[type="file"]').selectFile(file1, {force: true})
      cy.get('[aria-live="polite"]').should('contain.text', 'Selected file: test.jpg')
      
      // Select second file
      cy.get('input[type="file"]').selectFile(file2, {force: true})
      cy.get('[aria-live="polite"]').should('contain.text', 'Selected file: test.json')
    })

    it('supports keyboard navigation', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Mobile button should be focusable (visible on mobile viewport)
      cy.get('button').last().should('exist')
      cy.get('button').last().should('be.visible')
      
      // File input should not be focusable (hidden)
      cy.get('input[type="file"]').should('have.attr', 'tabindex', '-1')
    })

    it('maintains focus management', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Focus should not move to hidden file input
      cy.get('input[type="file"]').should('not.be.focused')
      
      // Mobile button should be naturally focusable
      cy.get('button').last().focus()
      cy.get('button').last().should('be.focused')
    })

    it('has proper button semantics', () => {
      cy.mount(<FileInput onChange={() => {}}>Choose File</FileInput>)
      
      // Desktop button should have proper type
      cy.get('button').first().should('have.attr', 'type', 'button')
      
      // Mobile button should exist and be accessible
      cy.get('button').last().should('exist')
    })

    it('handles multiple FileInput components with unique IDs', () => {
      cy.mount(
        <div>
          <FileInput onChange={() => {}}>First Input</FileInput>
          <FileInput onChange={() => {}}>Second Input</FileInput>
        </div>
      )
      
      const firstId = cy.get('input[type="file"]').first().invoke('attr', 'id')
      const secondId = cy.get('input[type="file"]').last().invoke('attr', 'id')
      
      // IDs should be different
      firstId.then(id1 => {
        secondId.then(id2 => {
          expect(id1).to.not.equal(id2)
        })
      })
    })

    it('provides screen reader context for file types', () => {
      cy.mount(
        <FileInput accept=".pdf,.doc" onChange={() => {}}>
          Upload Document
        </FileInput>
      )
      
      // The aria-label should be descriptive
      cy.get('input[type="file"]').should('have.attr', 'aria-label')
      cy.get('button').last().should('have.attr', 'aria-label')
    })
  })

}) 