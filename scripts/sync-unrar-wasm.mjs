/**
 * Syncs unrar.wasm from node-unrar-js to public/vendor/unrar for browser loading
 *
 * Only used for CBR comic support
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules', 'node-unrar-js', 'esm', 'js', 'unrar.wasm')
const destDir = path.join(root, 'public', 'vendor', 'unrar')
const dest = path.join(destDir, 'unrar.wasm')

if (!fs.existsSync(src)) {
  console.warn('[sync-unrar-wasm] node-unrar-js unrar.wasm not found; skipping')
  process.exit(0)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(src, dest)
console.log('[sync-unrar-wasm] copied to public/vendor/unrar/unrar.wasm')
