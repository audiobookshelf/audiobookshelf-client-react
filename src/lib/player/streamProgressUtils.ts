/** HLS transcode segment index or inclusive range (e.g. `"3-7"`). */
export type TranscodeChunk = number | string

/**
 * Compute how much of an HLS transcode stream is ready on the server (0–1).
 * Matches Vue `PlayerUi.setChunksReady`.
 */
export function computeTranscodePercentReady(chunks: TranscodeChunk[], numSegments: number): number {
  if (!numSegments) return 0

  let largestSeg = 0
  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      const chunkRange = chunk.split('-').map((c) => Number(c))
      if (chunkRange.length < 2) continue
      if (chunkRange[1] > largestSeg) largestSeg = chunkRange[1]
    } else if (chunk > largestSeg) {
      largestSeg = chunk
    }
  }

  return largestSeg / numSegments
}
