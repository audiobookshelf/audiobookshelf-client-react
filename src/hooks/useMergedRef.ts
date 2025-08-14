import React from 'react'

// Custom hook to merge internal and external refs
export const useMergedRef = <T>(externalRef?: React.Ref<T>) => {
  const readRef = React.useRef<T>(null)

  const writeRef = React.useCallback(
    (node: T | null) => {
      // Always update internal
      readRef.current = node

      // Optionally update external
      if (!externalRef) return
      if (typeof externalRef === 'function') {
        externalRef(node)
      } else {
        ;(externalRef as React.RefObject<T | null>).current = node
      }
    },
    [externalRef]
  )

  return [readRef, writeRef] as const
}
