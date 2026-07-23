import { Library } from '@/types/api'

function sortLibrariesByDisplayOrder(libraries: Library[]) {
  return [...libraries].sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Resolve the active library from a list, matching Vue getNextAccessibleLibrary behavior.
 * Falls back to the first library (by display order) when the preferred id is missing.
 */
export function resolveEffectiveLibrary(libraries: Library[] | undefined, preferredLibraryId?: string | null): Library | undefined {
  if (!libraries?.length) return undefined

  if (preferredLibraryId) {
    const preferredLibrary = libraries.find((library) => library.id === preferredLibraryId)
    if (preferredLibrary) return preferredLibrary
  }

  return sortLibrariesByDisplayOrder(libraries)[0]
}
