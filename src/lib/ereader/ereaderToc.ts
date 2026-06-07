export interface EreaderTocItem {
  id: string
  label: string
  href: string
  subitems?: EreaderTocItem[]
}

interface FoliateTocNode {
  label?: string | Record<string, string>
  href?: string
  subitems?: FoliateTocNode[]
}

function getTocLabel(label: FoliateTocNode['label']): string {
  if (typeof label === 'string') return label.trim()
  if (label && typeof label === 'object') {
    const value = Object.values(label)[0]
    if (value) return String(value).trim()
  }
  return ''
}

/** Comic archive entries use zip paths as labels; show the filename only */
function formatTocLabel(label: string, href: string): string {
  const text = label || href
  const slash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'))
  return slash >= 0 ? text.slice(slash + 1) : text
}

export function normalizeEreaderToc(items: FoliateTocNode[] | undefined, path = ''): EreaderTocItem[] {
  if (!items?.length) return []

  const result: EreaderTocItem[] = []

  for (const [index, item] of items.entries()) {
    const href = item.href?.trim()
    if (!href) continue

    const id = `${path}${index}`
    const rawLabel = getTocLabel(item.label) || href
    const entry: EreaderTocItem = {
      id,
      label: formatTocLabel(rawLabel, href),
      href
    }

    if (item.subitems?.length) {
      entry.subitems = normalizeEreaderToc(item.subitems, `${id}-`)
    }

    result.push(entry)
  }

  return result
}
