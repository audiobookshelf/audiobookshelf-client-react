'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { useSlate } from 'slate-react'
import { HistoryEditor } from 'slate-history'

import { MarkButton } from './Mark'
import { BlockButton } from './Block'
import { UndoButton, RedoButton } from './History'
import { LinkButton } from './Link'
import { useLinkModalContext } from '@/contexts/LinkModalContext'
import { DOMElement } from '@/types/slate'

export const Toolbar = () => {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const editor = useSlate() as HistoryEditor
  const { openModal } = useLinkModalContext()

  // Internal state for focus management
  const [focusedButtonId, setFocusedButtonId] = useState<string>('bold')

  // Calculate undo/redo availability directly - the component re-renders when editor changes
  const isUndoAvailable = (editor.history.undos?.length || 0) > 0
  const isRedoAvailable = (editor.history.redos?.length || 0) > 0

  // Calculate button availability
  const buttonAvailability = useMemo(
    () => ({
      bold: true,
      italic: true,
      strike: true,
      'bulleted-list': true,
      'numbered-list': true,
      link: true,
      undo: isUndoAvailable,
      redo: isRedoAvailable
    }),
    [isUndoAvailable, isRedoAvailable]
  )

  // Get list of available (non-disabled) button IDs in order
  const availableButtons = useMemo(() => {
    const allButtons = ['bold', 'italic', 'strike', 'bulleted-list', 'numbered-list', 'link', 'undo', 'redo']
    return allButtons.filter((buttonId) => buttonAvailability[buttonId as keyof typeof buttonAvailability])
  }, [buttonAvailability])

  // Auto-focus fallback when current focused button becomes unavailable
  useEffect(() => {
    const isFocusedButtonAvailable = buttonAvailability[focusedButtonId as keyof typeof buttonAvailability]

    if (!isFocusedButtonAvailable) {
      if (availableButtons.length > 0) {
        let newFocusedButton = availableButtons[0]

        // Special handling for undo/redo buttons - prefer switching to the other one
        if (focusedButtonId === 'undo' && buttonAvailability.redo) {
          newFocusedButton = 'redo'
        } else if (focusedButtonId === 'redo' && buttonAvailability.undo) {
          newFocusedButton = 'undo'
        }

        setFocusedButtonId(newFocusedButton)

        // If we have a toolbar ref, try to move focus
        if (toolbarRef.current) {
          const newButtonElement = toolbarRef.current.querySelector(`[data-button-id="${newFocusedButton}"]`) as HTMLButtonElement
          if (newButtonElement && !newButtonElement.disabled) {
            // Use a small delay to ensure React has updated the disabled state
            setTimeout(() => {
              if (!newButtonElement.disabled) {
                newButtonElement.focus()
              }
            }, 0)
          }
        }
      }
    }
  }, [focusedButtonId, buttonAvailability, availableButtons])

  // Handle toolbar keyboard navigation with roving tabindex
  const handleToolbarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const toolbar = e.currentTarget as HTMLElement
      const buttons = Array.from(toolbar.querySelectorAll('button:not([disabled])'))
      const currentIndex = buttons.findIndex((button) => button === document.activeElement)

      if (currentIndex === -1) return

      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          nextIndex = (currentIndex + 1) % buttons.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
          break
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = buttons.length - 1
          break
        default:
          return
      }

      const nextButton = buttons[nextIndex] as HTMLButtonElement
      if (nextButton) {
        // Update the focused button ID based on the button's data attribute
        const buttonId = nextButton.getAttribute('data-button-id')
        if (buttonId) {
          // Only update focus if the button is available
          const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]
          if (isButtonAvailable) {
            setFocusedButtonId(buttonId)
            nextButton.focus()
          }
        }
      }
    },
    [buttonAvailability]
  )

  // Custom hook for button focus management
  const getButtonProps = useCallback(
    (buttonId: string) => ({
      buttonId,
      tabIndex: (() => {
        const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]
        // Disabled buttons should never have tabIndex=0
        if (!isButtonAvailable) {
          return -1
        }
        return focusedButtonId === buttonId ? 0 : -1
      })(),
      onFocus: () => {
        const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]
        // Only allow focusing on available buttons
        if (isButtonAvailable) {
          setFocusedButtonId(buttonId)
        }
      }
    }),
    [focusedButtonId, buttonAvailability]
  )

  // Handle focus loss from disabled buttons
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const handleFocusOut = (event: FocusEvent) => {
      // Check if focus is leaving the toolbar entirely
      const relatedTarget = event.relatedTarget as DOMElement | null
      const isStayingInToolbar = relatedTarget && toolbar.contains(relatedTarget)

      if (!isStayingInToolbar) {
        // Focus left the toolbar, check if we need to restore it
        const isFocusedButtonAvailable = buttonAvailability[focusedButtonId as keyof typeof buttonAvailability]

        if (!isFocusedButtonAvailable) {
          // The focused button became unavailable, move to best available
          if (availableButtons.length > 0) {
            let newFocusedButton = availableButtons[0]

            // Special handling for undo/redo buttons - prefer switching to the other one
            if (focusedButtonId === 'undo' && buttonAvailability.redo) {
              newFocusedButton = 'redo'
            } else if (focusedButtonId === 'redo' && buttonAvailability.undo) {
              newFocusedButton = 'undo'
            }

            setFocusedButtonId(newFocusedButton)

            setTimeout(() => {
              const newButtonElement = toolbar.querySelector(`[data-button-id="${newFocusedButton}"]`) as HTMLButtonElement
              if (newButtonElement && !newButtonElement.disabled) {
                newButtonElement.focus()
              }
            }, 0)
          }
        }
      }
    }

    toolbar.addEventListener('focusout', handleFocusOut)
    return () => toolbar.removeEventListener('focusout', handleFocusOut)
  }, [focusedButtonId, buttonAvailability, availableButtons])

  return (
    <div
      ref={toolbarRef}
      className="pb-2 border-b border-border bg-transparent flex gap-[1.5vw]"
      role="toolbar"
      aria-label="Text formatting toolbar"
      aria-orientation="horizontal"
      onKeyDown={handleToolbarKeyDown}
    >
      <div role="group" aria-label="Text" className="flex border border-border rounded-sm overflow-hidden">
        <MarkButton {...getButtonProps('bold')}>format_bold</MarkButton>
        <MarkButton {...getButtonProps('italic')}>format_italic</MarkButton>
        <MarkButton {...getButtonProps('strike')}>format_strikethrough</MarkButton>
        <LinkButton onOpenModal={openModal} {...getButtonProps('link')} />
      </div>
      <div role="group" aria-label="Lists" className="flex border border-border rounded-sm overflow-hidden">
        <BlockButton {...getButtonProps('bulleted-list')}>format_list_bulleted</BlockButton>
        <BlockButton {...getButtonProps('numbered-list')}>format_list_numbered</BlockButton>
      </div>
      <div className="flex-grow" />
      <div role="group" aria-label="History" className="flex border border-border rounded-sm overflow-hidden">
        <UndoButton {...getButtonProps('undo')} isUndoAvailable={isUndoAvailable} />
        <RedoButton {...getButtonProps('redo')} isRedoAvailable={isRedoAvailable} />
      </div>
    </div>
  )
}
