const CANVAS_SIZE = 64

/**
 * Downsample cover art and average RGB inside the artwork, trimming edges (common borders),
 * skipping near-black / near-white and mostly transparent pixels.
 */
export async function extractAverageAccentRgb(imageUrl: string): Promise<{ r: number; g: number; b: number }> {
  const img = new Image()
  img.src = imageUrl

  await img.decode().catch(() => {
    throw new Error('Cover image decode failed')
  })

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable')
  }

  ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const pixels = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data

  const edge = Math.max(2, Math.floor(CANVAS_SIZE * 0.1))
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let y = edge; y < CANVAS_SIZE - edge; y++) {
    for (let x = edge; x < CANVAS_SIZE - edge; x++) {
      const i = (y * CANVAS_SIZE + x) << 2
      const rr = pixels[i]
      const gg = pixels[i + 1]
      const bb = pixels[i + 2]
      const aa = pixels[i + 3]
      if (aa < 100) continue
      const lum = 0.299 * rr + 0.587 * gg + 0.114 * bb
      if (lum < 18 || lum > 237) continue
      r += rr
      g += gg
      b += bb
      count++
    }
  }

  if (count === 0) {
    let rAll = 0
    let gAll = 0
    let bAll = 0
    let cAll = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 80) continue
      rAll += pixels[i]
      gAll += pixels[i + 1]
      bAll += pixels[i + 2]
      cAll++
    }
    if (cAll === 0) {
      return { r: 90, g: 90, b: 110 }
    }
    return {
      r: Math.round(rAll / cAll),
      g: Math.round(gAll / cAll),
      b: Math.round(bAll / cAll)
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  }
}
