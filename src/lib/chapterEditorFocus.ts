export const CHAPTERS_EDIT_TABLE_ATTR = 'data-chapters-edit-table'

/** Commit in-progress table edits by blurring a focused field inside the chapters table. */
export function blurActiveChapterEditorField(): void {
  const active = document.activeElement
  if (active instanceof HTMLElement && active.closest(`[${CHAPTERS_EDIT_TABLE_ATTR}]`)) {
    active.blur()
  }
}
