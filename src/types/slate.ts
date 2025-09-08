import { Descendant } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

// --- Slate Editor Type Definitions ---

export type DOMNode = globalThis.Node
export type DOMElement = globalThis.Element

export type CustomElement = {
  type: 'paragraph' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link'
  url?: string
  children: Descendant[]
}

export type CustomText = {
  text: string
  bold?: true
  italic?: true
  strike?: true
}

// Module augmentation for Slate types
declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}
