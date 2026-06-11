export const FIXED_LAYOUT_ZOOM_STEP = 0.1
export const FIXED_LAYOUT_ZOOM_MAX = 5

export type FixedLayoutPageSize = { width: number; height: number }

function roundScale(value: number): number {
  return Math.round(value * 10) / 10
}

/** Native page dimensions from a foliate fixed-layout iframe document */
export function getFixedLayoutPageSize(doc: Document): FixedLayoutPageSize | null {
  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content')
  if (viewport) {
    const entries = viewport
      .split(/[,;\s]/)
      .filter(Boolean)
      .map((part) => part.split('=').map((value) => value.trim()))
      .filter((part): part is [string, string] => part.length === 2)
    const size = Object.fromEntries(entries)
    if (size.width && size.height) {
      return { width: parseFloat(size.width), height: parseFloat(size.height) }
    }
  }

  const img = doc.querySelector('img')
  if (img?.naturalWidth) {
    return { width: img.naturalWidth, height: img.naturalHeight }
  }

  return null
}

/** Same fit-page formula foliate uses for a single centered page */
export function computeFitPageScale(container: DOMRectReadOnly, page: FixedLayoutPageSize): number {
  return roundScale(Math.min(container.width / page.width, container.height / page.height) || 1)
}

export function applyFixedLayoutZoom(renderer: HTMLElement, scale: number | null): void {
  if (scale === null) renderer.removeAttribute('zoom')
  else renderer.setAttribute('zoom', String(roundScale(scale)))
}

/**
 * Step-based zoom for PDF/CBZ
 * Step 0 = foliate auto fit-page (no zoom attribute)
 * Step N = fit-page scale + N * step
 */
export class FixedLayoutZoomController {
  private steps = 0
  private pageSize: FixedLayoutPageSize | null = null
  private baseline: number | null = null

  reset(): void {
    this.steps = 0
    this.pageSize = null
    this.baseline = null
  }

  get isZoomed(): boolean {
    return this.steps > 0
  }

  setPageSize(size: FixedLayoutPageSize, renderer?: HTMLElement): void {
    this.pageSize = size
    this.baseline = null
    if (this.steps > 0 && renderer) this.reapply(renderer)
  }

  private getBaseline(renderer: HTMLElement): number | null {
    if (!this.pageSize) return null
    const baseline = computeFitPageScale(renderer.getBoundingClientRect(), this.pageSize)
    this.baseline = baseline
    return baseline
  }

  private scaleForSteps(renderer: HTMLElement): number | null {
    const baseline = this.baseline ?? this.getBaseline(renderer)
    if (baseline === null) return null
    return roundScale(Math.min(FIXED_LAYOUT_ZOOM_MAX, baseline + this.steps * FIXED_LAYOUT_ZOOM_STEP))
  }

  private reapply(renderer: HTMLElement): number | null {
    if (this.steps === 0) {
      applyFixedLayoutZoom(renderer, null)
      return null
    }
    const scale = this.scaleForSteps(renderer)
    if (scale === null) return null
    applyFixedLayoutZoom(renderer, scale)
    return scale
  }

  zoomIn(renderer: HTMLElement): number | null {
    if (!this.pageSize) return null
    const baseline = this.baseline ?? this.getBaseline(renderer)
    if (baseline === null) return null

    const atMax = this.steps > 0 && baseline + this.steps * FIXED_LAYOUT_ZOOM_STEP >= FIXED_LAYOUT_ZOOM_MAX - 0.001
    if (atMax) return this.scaleForSteps(renderer)

    this.steps += 1
    return this.reapply(renderer)
  }

  zoomOut(renderer: HTMLElement): number | null {
    if (this.steps === 0) return null
    this.steps -= 1
    return this.reapply(renderer)
  }
}
