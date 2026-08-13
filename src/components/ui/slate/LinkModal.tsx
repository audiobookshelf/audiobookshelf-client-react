'use client'

import React, { memo } from 'react'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

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
    const t = useTypeSafeTranslations()

    return (
      <Modal isOpen={isOpen} onClose={closeModal} className="w-[400px]">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">{t('LabelTextEditorInsertLink')}</h3>

          <div className="space-y-4">
            <div>
              <TextInput
                ref={textInputRef}
                label={t('LabelTextEditorText')}
                placeholder={t('PlaceholderLinkTextOptional')}
                value={text}
                onChange={setText}
                onKeyDown={handleTextKeyDown}
                enterKeyHint="next"
              />
            </div>

            <div>
              <TextInput
                ref={urlInputRef}
                label="URL" // i18n-ignore
                placeholder="https://example.com"
                value={url}
                onChange={setUrl}
                onKeyDown={handleUrlKeyDown}
                enterKeyHint="done"
                error={urlError}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Btn color="bg-button-selected-bg disabled:bg-button-selected-bg/80" onClick={handleLink} disabled={!isValidUrl}>
                {t('LabelTextEditorLink')}
              </Btn>

              {isLinkActive && (
                <Btn color="bg-primary" onClick={handleUnlink}>
                  {t('LabelTextEditorUnlink')}
                </Btn>
              )}

              <Btn color="bg-primary" onClick={closeModal}>
                {t('ButtonCancel')}
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
)

LinkModal.displayName = 'LinkModal'
