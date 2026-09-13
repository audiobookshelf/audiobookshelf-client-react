const DEFAULT_LIST_FORMAT_OPTIONS: Intl.ListFormatOptions = { type: 'unit' }

export function formatList(labels: string[], locale: string, options?: Intl.ListFormatOptions): string {
  if (labels.length === 0) return ''
  return new Intl.ListFormat(locale, { ...DEFAULT_LIST_FORMAT_OPTIONS, ...options }).format(labels)
}

export function listFormatParts(labels: string[], locale: string, options?: Intl.ListFormatOptions) {
  if (labels.length === 0) return []
  return new Intl.ListFormat(locale, { ...DEFAULT_LIST_FORMAT_OPTIONS, ...options }).formatToParts(labels)
}
