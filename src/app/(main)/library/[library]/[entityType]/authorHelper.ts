'use client'

import { getProviderRegion } from '@/lib/providerUtils'
import { Author, AuthorQuickMatchPayload } from '@/types/api'
import { quickMatchAuthorAction } from './actions'

export const quickMatchAuthor = async (author: Author, libraryProvider: string, editedAuthor?: Partial<Author>) => {
  const region = getProviderRegion(libraryProvider)

  const payload: AuthorQuickMatchPayload = {
    region
  }
  if (editedAuthor?.asin) {
    payload.asin = editedAuthor.asin
  } else if (editedAuthor?.name) {
    payload.q = editedAuthor.name
  } else {
    payload.q = author.name
  }
  return quickMatchAuthorAction(author.id, payload)
}
