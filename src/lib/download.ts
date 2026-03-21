interface DownloadByUrlOptions {
  filename?: string
  openInNewTab?: boolean
}

export function downloadByUrl(url: string, { filename, openInNewTab = false }: DownloadByUrlOptions = {}) {
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url

  if (filename != null) {
    link.download = filename
  }
  if (openInNewTab) {
    link.target = '_blank'
  }

  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
  })
}

export function downloadLibraryItem(libraryItemId: string) {
  downloadByUrl(`/internal-api/items/${libraryItemId}/download`)
}

export function downloadLibraryItemFile(libraryItemId: string, fileId: string, filename?: string) {
  downloadByUrl(`/internal-api/items/${libraryItemId}/file/${fileId}/download`, { filename })
}
