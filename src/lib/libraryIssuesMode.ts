export const LIBRARY_ISSUES_MODE_PARAM = 'issues'
export const LIBRARY_ISSUES_MODE_VALUE = '1'

export function libraryIssuesModeHref(libraryId: string): string {
  return `/library/${libraryId}/items?${LIBRARY_ISSUES_MODE_PARAM}=${LIBRARY_ISSUES_MODE_VALUE}`
}

export function isLibraryIssuesMode(pathname: string, searchParams: Pick<URLSearchParams, 'get'>): boolean {
  return pathname.endsWith('/items') && searchParams.get(LIBRARY_ISSUES_MODE_PARAM) === LIBRARY_ISSUES_MODE_VALUE
}
