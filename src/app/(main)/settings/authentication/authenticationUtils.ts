import { AuthenticationSettings } from '@/types/api'

export function applyAuthSettingsDefaults(settings: AuthenticationSettings, routerBasePath: string): AuthenticationSettings {
  return {
    ...settings,
    authOpenIDMobileRedirectURIs: settings.authOpenIDMobileRedirectURIs ?? [],
    authOpenIDSubfolderForRedirectURLs: settings.authOpenIDSubfolderForRedirectURLs === undefined ? routerBasePath : settings.authOpenIDSubfolderForRedirectURLs
  }
}

function isValidRedirectURI(uri: string): boolean {
  const pattern = /^\w+:\/\/[\w.-]+(\/[\w./-]*)*$/i
  return pattern.test(uri)
}

function isValidClaim(claim: string | null | undefined): boolean {
  if (!claim || claim === '') return true
  const pattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/i
  return pattern.test(claim)
}

export function validateOpenIdSettings(settings: AuthenticationSettings): string[] {
  const errors: string[] = []

  if (!settings.authOpenIDIssuerURL) {
    errors.push('Issuer URL required')
  }
  if (!settings.authOpenIDAuthorizationURL) {
    errors.push('Authorize URL required')
  }
  if (!settings.authOpenIDTokenURL) {
    errors.push('Token URL required')
  }
  if (!settings.authOpenIDUserInfoURL) {
    errors.push('Userinfo URL required')
  }
  if (!settings.authOpenIDJwksURL) {
    errors.push('JWKS URL required')
  }
  if (!settings.authOpenIDClientID) {
    errors.push('Client ID required')
  }
  if (!settings.authOpenIDClientSecret) {
    errors.push('Client Secret required')
  }
  if (!settings.authOpenIDTokenSigningAlgorithm) {
    errors.push('Signing Algorithm required')
  }

  const uris = settings.authOpenIDMobileRedirectURIs ?? []
  if (uris.includes('*') && uris.length > 1) {
    errors.push('Mobile Redirect URIs: Asterisk (*) must be the only entry if used')
  } else {
    uris.forEach((uri) => {
      if (uri !== '*' && !isValidRedirectURI(uri)) {
        errors.push(`Mobile Redirect URIs: Invalid URI ${uri}`)
      }
    })
  }

  if (!isValidClaim(settings.authOpenIDGroupClaim)) {
    errors.push('Group Claim: Invalid claim name')
  }
  if (!isValidClaim(settings.authOpenIDAdvancedPermsClaim)) {
    errors.push('Advanced Permission Claim: Invalid claim name')
  }

  return errors
}

export function normalizeIssuerUrl(issuerUrl: string): string {
  let normalized = issuerUrl
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  if (normalized.endsWith('/.well-known/openid-configuration')) {
    normalized = normalized.replace('/.well-known/openid-configuration', '')
  }
  return normalized
}

export function getWebCallbackUrl(subfolder: string | undefined): string {
  return `https://<your.server.com>${subfolder || ''}/auth/openid/callback`
}

export function getMobileAppCallbackUrl(subfolder: string | undefined): string {
  return `https://<your.server.com>${subfolder || ''}/auth/openid/mobile-redirect`
}
