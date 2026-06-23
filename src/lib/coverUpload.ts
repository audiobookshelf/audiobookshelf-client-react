import { UploadCoverResponse } from '@/types/api'

function parseUploadErrorMessage(status: number, text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return `Upload failed with status ${status}`
  }
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return `Upload failed with status ${status}`
  }
  try {
    const data = JSON.parse(trimmed) as { error?: string }
    return data.error?.trim() || trimmed
  } catch {
    return trimmed
  }
}

/**
 * Upload a cover image via the internal-api proxy so httpOnly cookies and
 * token refresh are handled server-side (same pattern as file downloads).
 */
export async function uploadCoverFile(libraryItemId: string, file: File): Promise<UploadCoverResponse> {
  const form = new FormData()
  form.set('cover', file, file.name)

  const response = await fetch(`/internal-api/items/${libraryItemId}/cover`, {
    method: 'POST',
    body: form
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(parseUploadErrorMessage(response.status, text))
  }

  return response.json() as Promise<UploadCoverResponse>
}
