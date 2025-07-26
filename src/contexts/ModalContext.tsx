'use client'

import React, { createContext, useContext } from 'react'

const ModalContext = createContext(false)

export const useIsInsideModal = () => useContext(ModalContext)

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ModalContext.Provider value={true}>{children}</ModalContext.Provider>
}
