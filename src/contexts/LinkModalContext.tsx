'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { Editor } from 'slate'
import { useLinkModal } from '@/hooks/useLinkModal'

interface LinkModalContextType {
  isOpen: boolean
  text: string
  url: string
  urlError: string
  textInputRef: React.RefObject<HTMLInputElement | null>
  urlInputRef: React.RefObject<HTMLInputElement | null>
  openModal: () => void
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

const LinkModalContext = createContext<LinkModalContextType | null>(null)

interface LinkModalProviderProps {
  children: ReactNode
  editor: Editor
}

export const LinkModalProvider = ({ children, editor }: LinkModalProviderProps) => {
  const linkModal = useLinkModal(editor)

  return <LinkModalContext.Provider value={linkModal}>{children}</LinkModalContext.Provider>
}

export const useLinkModalContext = () => {
  const context = useContext(LinkModalContext)
  if (!context) {
    throw new Error('useLinkModalContext must be used within a LinkModalProvider')
  }
  return context
}
