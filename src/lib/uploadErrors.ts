export function parseUploadErrorMessage(status: number, text: string): string {
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
