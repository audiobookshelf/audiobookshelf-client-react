/**
 * foliate-js does not natively support CBR comics
 * this creates a custom comic book loader for CBR using node-unrar-js
 */

import { blobToEbookFile } from '@/lib/ereader/ereaderEbook'
import { makeComicBook } from 'foliate-js/comic-book.js'
import { createExtractorFromData, type Extractor, type FileHeader } from 'node-unrar-js/esm/index.esm.js'

const DEFAULT_WASM_URL = '/vendor/unrar/unrar.wasm'

/** Same extensions as foliate-js/comic-book.js */
const COMIC_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.jxl', '.avif']

const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.jxl': 'image/jxl',
  '.avif': 'image/avif'
}

let wasmBinary: ArrayBuffer | null = null

export type CreateCbrComicBookOptions = {
  wasmUrl?: string
}

function isComicImagePath(path: string): boolean {
  const lower = path.toLowerCase()
  return COMIC_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function mimeForPath(path: string): string {
  const lower = path.toLowerCase()
  const ext = COMIC_IMAGE_EXTENSIONS.find((candidate) => lower.endsWith(candidate))
  return (ext && IMAGE_MIME[ext]) || 'application/octet-stream'
}

async function getUnrarWasm(wasmUrl = DEFAULT_WASM_URL): Promise<ArrayBuffer> {
  if (!wasmBinary) {
    const response = await fetch(wasmUrl)
    if (!response.ok) throw new Error(`Failed to load unrar.wasm (${response.status})`)
    wasmBinary = await response.arrayBuffer()
  }
  return wasmBinary
}

function listComicImagePaths(fileHeaders: Iterable<FileHeader>): string[] {
  const paths = [...fileHeaders].filter((header) => !header.flags.directory && isComicImagePath(header.name)).map((header) => header.name)

  paths.sort(new Intl.Collator([], { numeric: true }).compare)
  return paths
}

function buildSizeMap(fileHeaders: Iterable<FileHeader>): Map<string, number> {
  const sizes = new Map<string, number>()
  for (const header of fileHeaders) {
    if (!header.flags.directory) sizes.set(header.name, header.unpSize)
  }
  return sizes
}

/**
 * Build a foliate comic book from a CBR blob using node-unrar-js (lazy per-page extraction)
 * Note: Multi-volume and password-protected archives are not supported
 */
export async function createCbrComicBook(cbrBlob: Blob, title: string, options: CreateCbrComicBookOptions = {}): Promise<ReturnType<typeof makeComicBook>> {
  const wasm = await getUnrarWasm(options.wasmUrl)
  const data = await cbrBlob.arrayBuffer()
  const extractor: Extractor<Uint8Array> = await createExtractorFromData({ wasmBinary: wasm, data })

  const list = extractor.getFileList()
  const imagePaths = listComicImagePaths(list.fileHeaders)
  if (!imagePaths.length) throw new Error('No supported image files in archive')

  const sizes = buildSizeMap(list.fileHeaders)
  const entries = imagePaths.map((filename) => ({ filename }))

  const loader = {
    entries,
    loadBlob: async (name: string) => {
      const extracted = extractor.extract({ files: [name] })
      const files = [...extracted.files]
      const extraction = files[0]?.extraction
      if (!extraction) throw new Error(`Failed to extract "${name}" from CBR archive`)

      return new Blob([extraction.slice()], { type: mimeForPath(name) })
    },
    getSize: (name: string) => sizes.get(name) ?? 0
  }

  const file = blobToEbookFile(cbrBlob, 'cbr', title)
  return makeComicBook(loader, file)
}
