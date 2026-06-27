import type { Author, LibraryItem, PersonalizedShelfType, Series } from '@/types/api'

export type SearchShelfType = PersonalizedShelfType | 'tags' | 'genres' | 'narrators'

export interface TagShelfEntity {
  name: string
  type: 'tags'
  numItems: number
}

export interface GenreShelfEntity {
  name: string
  type: 'genres'
  numItems: number
}

export interface NarratorShelfEntity {
  name: string
  numBooks: number
  type: 'narrator'
}

export type SearchShelfEntity = LibraryItem | Series | Author | TagShelfEntity | GenreShelfEntity | NarratorShelfEntity

export interface SearchShelf {
  id: string
  label: string
  type: SearchShelfType
  entities: SearchShelfEntity[]
  total: number
}
