'use server'

import { deleteAuthor, quickMatchAuthor, removeAuthorImage, submitAuthorImage, updateAuthor } from '@/lib/api'
import { Author, AuthorQuickMatchPayload } from '@/types/api'

////////////////
// Author Actions
////////////////

export async function quickMatchAuthorAction(authorId: string, payload: AuthorQuickMatchPayload) {
  return quickMatchAuthor(authorId, payload).catch((error) => {
    // 404 returned when author is not found
    if (error?.status === 404) {
      return null
    }
    throw error
  })
}

export async function updateAuthorAction(authorId: string, editedAuthor: Partial<Author>) {
  return updateAuthor(authorId, editedAuthor)
}

export async function deleteAuthorAction(authorId: string) {
  return deleteAuthor(authorId)
}

export async function submitAuthorImageAction(authorId: string, url: string) {
  return await submitAuthorImage(authorId, { url })
}

export async function removeAuthorImageAction(authorId: string) {
  return await removeAuthorImage(authorId)
}
