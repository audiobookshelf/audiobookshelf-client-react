'use client'

import React, { memo } from 'react'
import { useLinkModalContext } from '@/contexts/LinkModalContext'
import { LinkModal } from './LinkModal'

export const LinkModalContainer = memo(() => {
  const linkModal = useLinkModalContext()

  return (
    <LinkModal
      isOpen={linkModal.isOpen}
      text={linkModal.text}
      url={linkModal.url}
      urlError={linkModal.urlError}
      textInputRef={linkModal.textInputRef}
      urlInputRef={linkModal.urlInputRef}
      closeModal={linkModal.closeModal}
      handleLink={linkModal.handleLink}
      handleUnlink={linkModal.handleUnlink}
      setText={linkModal.setText}
      setUrl={linkModal.setUrl}
      handleTextKeyDown={linkModal.handleTextKeyDown}
      handleUrlKeyDown={linkModal.handleUrlKeyDown}
      isLinkActive={linkModal.isLinkActive}
      isValidUrl={linkModal.isValidUrl}
    />
  )
})
