/**
 * Token compiled into the client bundle as Next's `basePath` during `next build`.
 *
 * Next inlines `basePath` into production chunks, so the deployed path cannot change without a
 * rebuild. Building with this token instead lets the server swap in the configured path at startup
 * (see `rewriteBuildBasePath`). It must never appear anywhere else in the app source.
 */
export const BASE_PATH_PLACEHOLDER = '/__ABS_BASE_PATH__'

/** Normalize to '' (root) or '/segment' with no trailing slash. */
export function normalizeBasePath(basePath: string | null | undefined): string {
  if (!basePath) return ''

  const trimmed = basePath.trim()
  if (!trimmed || trimmed === '/') return ''

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash
}

declare global {
  /** Set by Audiobookshelf before it starts Next. */
  var RouterBasePath: string | undefined
}

/**
 * The path the browser sees, resolved at process start.
 *
 * Audiobookshelf sets `global.RouterBasePath` from `ROUTER_BASE_PATH` before starting Next, so
 * both processes agree. Standalone `next dev` falls back to the env var.
 */
export function getConfiguredBasePath(): string {
  if (typeof globalThis.RouterBasePath === 'string') {
    return normalizeBasePath(globalThis.RouterBasePath)
  }
  return normalizeBasePath(process.env.ROUTER_BASE_PATH)
}

/**
 * The subfolder the client is served from, '' when served from the root.
 *
 * Next already prefixes `Link`, `useRouter`, `redirect`, and its own assets. It does not prefix
 * `next/image` `src`, `fetch`, Socket.IO, `window.location`, or raw API URLs — use these helpers
 * for those.
 *
 * On the server the value comes from the audiobookshelf global; in the browser it is read from the
 * attribute the root layout renders, since the value is only known at server start.
 */
export const BASE_PATH_ATTRIBUTE = 'data-base-path'

export function getClientBasePath(): string {
  if (typeof document !== 'undefined') {
    return normalizeBasePath(document.documentElement.getAttribute(BASE_PATH_ATTRIBUTE))
  }
  return getConfiguredBasePath()
}

/**
 * Prefix a root-relative URL. Absolute and protocol-relative URLs are returned unchanged (OIDC
 * logout can pass an IdP URL through the same helper).
 */
export function withBasePath(url: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) return url
  return `${getClientBasePath()}${url}`
}

/**
 * Matches the placeholder together with any backslashes escaping its leading slash.
 *
 * Route matchers embed the base path as a regex (`\/__ABS_BASE_PATH__`), and the JSON manifests
 * escape that again (`\\/__ABS_BASE_PATH__`). Leaving those backslashes in place would produce an
 * invalid pattern on a root deploy, so the replacement reuses whatever run it captured.
 */
const PLACEHOLDER_PATTERN = new RegExp(`(\\\\*)${BASE_PATH_PLACEHOLDER}`, 'g')

/**
 * Swap every placeholder occurrence for `basePath`, keeping each occurrence's escaping depth.
 * A root deploy ('') removes the slash and its backslashes along with the token.
 */
export function replaceBasePathPlaceholder(content: string, basePath: string): string {
  return content.replace(PLACEHOLDER_PATTERN, (_match, backslashes: string) => basePath.split('/').join(`${backslashes}/`))
}
