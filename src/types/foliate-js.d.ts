declare module 'foliate-js/view.js'

declare module 'foliate-js/comic-book.js' {
  interface ComicBookLoader {
    entries: Array<{ filename: string }>
    loadBlob: (name: string) => Promise<Blob>
    getSize: (name: string) => number
  }

  export function makeComicBook(
    loader: ComicBookLoader,
    file: File
  ): {
    toc?: Array<{ label: string; href: string }>
    sections?: Array<{ id: string; load?: () => Promise<string>; unload?: () => void; size?: number }>
    rendition?: { layout: string }
    getCover?: () => Promise<Blob>
    destroy?: () => void
    resolveHref?: (href: string) => { index: number }
    splitTOCHref?: (href: string) => [string, null]
    getTOCFragment?: (doc: Document) => Element
    metadata?: { title: string }
  }
}
