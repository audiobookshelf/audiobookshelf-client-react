export function libraryIssuesPageHref(libraryId: string): string {
  return `/library/${libraryId}/issues`
}

export function isLibraryIssuesPage(pathname: string): boolean {
  return pathname.endsWith('/issues')
}
