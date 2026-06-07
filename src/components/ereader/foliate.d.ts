export interface FoliateRelocateDetail {
  fraction?: number
  cfi?: string
  section?: { current?: number; total?: number }
  location?: { current?: number; total?: number }
}

export interface FoliateTocItem {
  label?: string | Record<string, string>
  href?: string
  subitems?: FoliateTocItem[]
}

export interface FoliateBook {
  toc?: FoliateTocItem[]
}

export interface FoliateRendererElement extends HTMLElement {
  setStyles: (styles: string | [string, string]) => void
}

export interface FoliateViewElement extends HTMLElement {
  book?: FoliateBook
  open: (file: Blob | string) => Promise<void>
  init: (options: { lastLocation?: string; showTextStart?: boolean }) => Promise<void>
  goTo: (target: number | string) => Promise<void>
  close: () => void
  goLeft: () => void | Promise<void>
  goRight: () => void | Promise<void>
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
