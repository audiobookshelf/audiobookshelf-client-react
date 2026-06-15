export interface FoliateRelocateDetail {
  fraction?: number
  cfi?: string
  index?: number
  section?: { current?: number; total?: number }
  location?: { current?: number; total?: number }
}

export interface FoliateTocItem {
  label?: string | Record<string, string>
  href?: string
  subitems?: FoliateTocItem[]
}

export interface FoliateSection {
  id?: string
}

export interface FoliateBook {
  toc?: FoliateTocItem[]
  sections?: FoliateSection[]
  rendition?: { layout?: string }
  transformTarget?: EventTarget
  resolveCFI?: (cfi: string) => { index: number }
  resolveHref?: (href: string) => { index: number } | null
  destroy?: () => void
}

export interface FoliateRendererElement extends HTMLElement {
  setStyles?: (styles: string | [string, string]) => void
  getContents?: () => Array<{ doc?: Document | null; index?: number }>
}

export interface FoliateSearchExcerpt {
  pre: string
  match: string
  post: string
}

export interface FoliateSearchHit {
  id: string
  cfi: string
  excerpt: FoliateSearchExcerpt
}

export interface FoliateSearchSection {
  id: string
  label: string
  hits: FoliateSearchHit[]
}

export type FoliateSearchYield =
  | 'done'
  | { progress: number }
  | { label: string; subitems: Array<{ cfi: string; excerpt: FoliateSearchExcerpt }> }
  | { cfi: string; excerpt: FoliateSearchExcerpt }

export interface FoliateSearchOptions {
  query: string
  index?: number
  matchCase?: boolean
  matchDiacritics?: boolean
  matchWholeWords?: boolean
}

export interface FoliateAnnotation {
  value: string
}

export interface FoliateViewElement extends HTMLElement {
  book?: FoliateBook
  open: (source: Blob | string | FoliateBook) => Promise<void>
  init: (options: { lastLocation?: string; showTextStart?: boolean }) => Promise<void>
  goTo: (target: number | string) => Promise<{ index: number } | undefined>
  goToFraction: (fraction: number) => Promise<void>
  select: (target: number | string) => Promise<void>
  close: () => void
  goLeft: () => void | Promise<void>
  goRight: () => void | Promise<void>
  search: (options: FoliateSearchOptions) => AsyncIterable<FoliateSearchYield>
  clearSearch: () => void
  addAnnotation: (annotation: FoliateAnnotation, remove?: boolean) => Promise<void>
  renderer: FoliateRendererElement
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'foliate-view': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export {}
