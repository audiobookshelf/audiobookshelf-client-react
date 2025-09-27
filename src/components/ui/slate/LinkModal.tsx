'use client'

import React, { memo } from 'react'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'

// --- LinkModal Component ---

interface LinkModalProps {
  isOpen: boolean
  text: string
  url: string
  urlError: string
  textInputRef: React.RefObject<HTMLInputElement | null>
  urlInputRef: React.RefObject<HTMLInputElement | null>
  closeModal: () => void
  handleLink: () => void
  handleUnlink: () => void
  setText: (text: string) => void
  setUrl: (url: string) => void
  handleTextKeyDown: (event: React.KeyboardEvent) => void
  handleUrlKeyDown: (event: React.KeyboardEvent) => void
  isLinkActive: boolean
  isValidUrl: boolean
}

export const LinkModal = memo(
  ({
    isOpen,
    text,
    url,
    urlError,
    textInputRef,
    urlInputRef,
    closeModal,
    handleLink,
    handleUnlink,
    setText,
    setUrl,
    handleTextKeyDown,
    handleUrlKeyDown,
    isLinkActive,
    isValidUrl
  }: LinkModalProps) => {
    return (
      <Modal isOpen={isOpen} onClose={closeModal} width={400}>
        <div className="bg-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Insert Link</h3>

          <div className="space-y-4">
            <div>
              <TextInput
                ref={textInputRef}
                label="Text"
                placeholder="Link text (optional)"
                value={text}
                onChange={setText}
                onKeyDown={handleTextKeyDown}
                enterKeyHint="next"
              />
            </div>

            <div>
              <TextInput
                ref={urlInputRef}
                label="URL"
                placeholder="https://example.com"
                value={url}
                onChange={setUrl}
                onKeyDown={handleUrlKeyDown}
                enterKeyHint="done"
                error={urlError}
              />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Btn color="bg-button-selected-bg disabled:bg-button-selected-bg/80" onClick={handleLink} disabled={!isValidUrl}>
                Link
              </Btn>

              {isLinkActive && (
                <Btn color="bg-primary" onClick={handleUnlink}>
                  Unlink
                </Btn>
              )}

              <Btn color="bg-primary" onClick={closeModal}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
)

LinkModal.displayName = 'LinkModal'
