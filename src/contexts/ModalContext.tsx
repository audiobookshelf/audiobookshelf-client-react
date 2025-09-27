'use client'

import React, { createContext, RefObject, useContext } from 'react'

interface ModalContextType {
  modalRef: RefObject<HTMLDivElement> | null
}

const ModalContext = createContext<ModalContextType>({
  modalRef: null
})

export const useModalRef = () => {
  const context = useContext(ModalContext)
  return context.modalRef
}

export const ModalProvider: React.FC<{
  children: React.ReactNode
  modalRef: RefObject<HTMLDivElement>
}> = ({ children, modalRef }) => {
  return <ModalContext.Provider value={{ modalRef }}>{children}</ModalContext.Provider>
}
