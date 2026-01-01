'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, Text } from 'slate'
import { ReactEditor } from 'slate-react'

import { getLinkUrl, getSelectedText, isLinkActive, unwrapLink, upsertLink } from '@/components/ui/slate/Link'

export const useLinkModal = (editor: Editor) => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [selectedUrl, setSelectedUrl] = useState('')
  const [linkActive, setLinkActive] = useState(false)

  const textInputRef = useRef<HTMLInputElement | null>(null)
  const urlInputRef = useRef<HTMLInputElement | null>(null)

  // URL validation function
  const validateUrl = useCallback((urlString: string): boolean => {
    if (!urlString.trim()) return false

    try {
      const url = new URL(urlString.trim())
      // Only allow safe protocols - this blocks all dangerous protocols by default
      const allowedProtocols = ['http:', 'https:']

      return allowedProtocols.includes(url.protocol)
    } catch {
      return false
    }
  }, [])

  // Update text and URL when modal opens with selected text/URL
  useEffect(() => {
    if (isOpen) {
      if (selectedText) {
        setText(selectedText)
      } else {
        setText('')
      }

      if (selectedUrl) {
        setUrl(selectedUrl)
      } else {
        setUrl('')
      }

      setUrlError('')

      // Focus the text field when modal opens
      setTimeout(() => {
        textInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, selectedText, selectedUrl])

  // Validate URL on change
  useEffect(() => {
    if (url.trim() && !validateUrl(url)) {
      setUrlError('Please enter a valid http:// or https:// URL')
    } else {
      setUrlError('')
    }
  }, [url, validateUrl])

  const isValidUrl = useMemo(() => validateUrl(url), [url, validateUrl])

  // Focus management - refocus editor when modal closes
  const prevIsOpen = useRef(isOpen)
  useEffect(() => {
    if (prevIsOpen.current && !isOpen) {
      // Focus on the next frame so it's after the DOM updates/unmount
      requestAnimationFrame(() => {
        try {
          // Safety check: ensure editor has valid content before focusing
          if (editor.children.length > 0) {
            // Check if the editor is actually attached to the DOM
            try {
              const editorElement = ReactEditor.toDOMNode(editor, editor)
              if (!editorElement || !document.body.contains(editorElement)) {
                return
              }
            } catch {
              // Editor not yet attached to DOM
              return
            }

            // Check if there's at least one text node and it can be resolved to DOM
            const textNodeEntry = Editor.nodes(editor, {
              at: [],
              match: (n) => Text.isText(n)
            }).next().value

            if (textNodeEntry) {
              // Verify that the text node can actually be resolved to a DOM node
              try {
                const [textNode] = textNodeEntry
                ReactEditor.toDOMNode(editor, textNode)
                // If we got here, the text node is in the DOM, so we can focus
                ReactEditor.focus(editor)
              } catch {
                // Text node not yet in DOM, skip focus
                return
              }
            }
          }
        } catch (error) {
          // Silently handle focus errors during hot reload or invalid states
          console.warn('useLinkModal: Could not focus editor:', error)
        }
      })
    }
    prevIsOpen.current = isOpen
  }, [isOpen, editor])

  const openModal = useCallback(() => {
    const currentText = getSelectedText(editor)
    const currentUrl = getLinkUrl(editor)
    const currentLinkActive = isLinkActive(editor)
    setSelectedText(currentText)
    setSelectedUrl(currentUrl)
    setLinkActive(currentLinkActive)
    setIsOpen(true)
  }, [editor])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setText('')
    setUrl('')
    setUrlError('')
    setSelectedText('')
    setSelectedUrl('')
    setLinkActive(false)
  }, [])

  const handleLink = useCallback(() => {
    const trimmedUrl = url.trim()
    if (trimmedUrl && isValidUrl) {
      upsertLink(editor, text.trim() || trimmedUrl, trimmedUrl)
      closeModal()
    }
  }, [editor, text, url, isValidUrl, closeModal])

  const handleUnlink = useCallback(() => {
    unwrapLink(editor)
    closeModal()
  }, [editor, closeModal])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, inputType: 'text' | 'url') => {
      if (event.key === 'Escape') {
        closeModal()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()

        if (inputType === 'text') {
          // Focus URL input when Enter is pressed in text input
          urlInputRef.current?.focus()
        } else if (inputType === 'url') {
          // Submit when Enter is pressed in URL input
          if (isValidUrl) {
            handleLink()
          }
        }
      }
    },
    [closeModal, handleLink, isValidUrl]
  )

  const handleTextKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      handleKeyDown(event, 'text')
    },
    [handleKeyDown]
  )

  const handleUrlKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      handleKeyDown(event, 'url')
    },
    [handleKeyDown]
  )

  return {
    // Modal state
    isOpen,
    text,
    url,
    urlError,
    selectedText,
    selectedUrl,

    // Refs for focus management
    textInputRef,
    urlInputRef,

    // Actions
    openModal,
    closeModal,
    handleLink,
    handleUnlink,
    setText,
    setUrl,

    // Event handlers
    handleTextKeyDown,
    handleUrlKeyDown,

    // Computed values
    isLinkActive: linkActive,
    isValidUrl
  }
}
