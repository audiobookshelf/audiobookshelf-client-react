/**
 * Syncs the pdfjs vendor files from the foliate-js package to the public/vendor/pdfjs directory.
 * This is used to serve the pdfjs library to the client.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules', 'foliate-js', 'vendor', 'pdfjs')
const dest = path.join(root, 'public', 'vendor', 'pdfjs')

if (!fs.existsSync(src)) {
  console.warn('[sync-pdfjs-vendor] foliate-js vendor/pdfjs not found; skipping')
  process.exit(0)
}

fs.cpSync(src, dest, { recursive: true })
console.log('[sync-pdfjs-vendor] copied to public/vendor/pdfjs')
