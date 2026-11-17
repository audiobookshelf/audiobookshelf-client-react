import { mediaTypeEssence } from '@/lib/mediaType'

const UNSAFE_CONTENT_TYPE = 'application/octet-stream'
const NOSNIFF = 'nosniff'
const ATTACHMENT_DISPOSITION = 'attachment'

const INLINE_PREFIXES = ['audio/', 'video/', 'image/']

export interface ProxiedFileSecurityHeaders {
  contentType: string
  inline: boolean
  headers: Record<string, string>
}

/**
 * Headers for a cookie-authenticated file response.
 * Images, audio, and video stay inline for `<img>` and `<audio>`.
 * Every other type downloads as an opaque attachment so HTML, XHTML, and SVG cannot run on the app origin.
 */
export function getProxiedFileSecurityHeaders(contentType: string | null | undefined): ProxiedFileSecurityHeaders {
  const essence = mediaTypeEssence(contentType)
  if (essence && isInlineSafeMediaType(essence)) {
    return {
      contentType: essence,
      inline: true,
      headers: {
        'Content-Type': essence,
        'X-Content-Type-Options': NOSNIFF
      }
    }
  }

  return {
    contentType: UNSAFE_CONTENT_TYPE,
    inline: false,
    headers: {
      'Content-Type': UNSAFE_CONTENT_TYPE,
      'Content-Disposition': ATTACHMENT_DISPOSITION,
      'X-Content-Type-Options': NOSNIFF
    }
  }
}

function isInlineSafeMediaType(essence: string): boolean {
  if (essence === 'image/svg+xml') return false
  return INLINE_PREFIXES.some((prefix) => essence.startsWith(prefix))
}
