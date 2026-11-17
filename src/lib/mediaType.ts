/** type/subtype token. `+` covers svg+xml and epub+zip. */
const MEDIA_TYPE_PATTERN = /^[\w.+-]+\/[\w.+-]+$/

/** Media-type essence: type/subtype with parameters and whitespace removed. Anything else is empty. */
export function mediaTypeEssence(type: string | undefined | null): string {
  const [essencePart] = (type ?? '').split(';')
  const essence = essencePart.trim().toLowerCase()
  return MEDIA_TYPE_PATTERN.test(essence) ? essence : ''
}
