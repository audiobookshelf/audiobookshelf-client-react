import type { EditableTrackFile } from '@/hooks/useTrackEditor'

/** Shared filename column sizing — flex-1 with a floor so the column cannot collapse to zero. */
export const TRACKS_FILENAME_COLUMN_CLASS = 'min-w-32 flex-1 overflow-hidden lg:min-w-48'

/** Responsive visibility — compact layout below lg matches mobile; desktop columns from lg up. */
export const TRACKS_COL_COMPACT = 'flex lg:hidden'
export const TRACKS_COL_COMPACT_CELL = 'lg:hidden'
export const TRACKS_COL_LG = 'hidden lg:block'
export const TRACKS_COL_LG_FLEX = 'hidden lg:flex'
export const TRACKS_COL_XL = 'hidden xl:block'
export const TRACKS_COL_XL_FLEX = 'hidden xl:flex'

export interface TracksListColumnVisibility {
  trackFromFilename: boolean
  trackFromMetadata: boolean
  discFromFilename: boolean
  discFromMetadata: boolean
  notes: boolean
}

function columnHasAnyValue(files: EditableTrackFile[], read: (file: EditableTrackFile) => unknown): boolean {
  return files.some((file) => {
    const value = read(file)
    return value != null && value !== ''
  })
}

/** Hide optional desktop columns when no track has a value for that field. */
export function getTracksListColumnVisibility(files: EditableTrackFile[]): TracksListColumnVisibility {
  return {
    trackFromFilename: columnHasAnyValue(files, (f) => f.trackNumFromFilename),
    trackFromMetadata: columnHasAnyValue(files, (f) => f.trackNumFromMeta),
    discFromFilename: columnHasAnyValue(files, (f) => f.discNumFromFilename),
    discFromMetadata: columnHasAnyValue(files, (f) => f.discNumFromMeta),
    notes: columnHasAnyValue(files, (f) => f.error)
  }
}
