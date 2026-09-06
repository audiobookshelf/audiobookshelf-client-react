'use client'

import { createContext, useContext, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'

export interface MetadataEditFooterContextValue {
  endContainer: HTMLElement | null
}

const MetadataEditFooterContext = createContext<MetadataEditFooterContextValue | null>(null)

export function MetadataEditFooterProvider({ value, children }: { value: MetadataEditFooterContextValue; children: ReactNode }) {
  return <MetadataEditFooterContext.Provider value={value}>{children}</MetadataEditFooterContext.Provider>
}

/** Present when the section is inside the shared metadata-edit footer. */
export function useMetadataEditFooter() {
  return useContext(MetadataEditFooterContext)
}

/** Render section end-actions into the shared metadata-edit footer slot. */
export function MetadataEditFooterEnd({ children }: { children: ReactNode }) {
  const footer = useMetadataEditFooter()
  if (!footer?.endContainer) return null
  return createPortal(children, footer.endContainer)
}

export type MetadataEditFooterEndSlotRef = Ref<HTMLDivElement | null>
