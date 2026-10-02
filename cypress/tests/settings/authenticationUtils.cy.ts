import { validateOpenIdSettings } from '@/app/(main)/settings/authentication/authenticationUtils'
import { AuthMethod, type AuthenticationSettings } from '@/types/api'

function settingsWithRedirectUris(uris: string[]): AuthenticationSettings {
  return {
    authActiveAuthMethods: [AuthMethod.OPENID],
    authOpenIDIssuerURL: 'https://issuer.example',
    authOpenIDAuthorizationURL: 'https://issuer.example/authorize',
    authOpenIDTokenURL: 'https://issuer.example/token',
    authOpenIDUserInfoURL: 'https://issuer.example/userinfo',
    authOpenIDJwksURL: 'https://issuer.example/jwks',
    authOpenIDClientID: 'client-id',
    authOpenIDClientSecret: 'client-secret',
    authOpenIDTokenSigningAlgorithm: 'RS256',
    authOpenIDButtonText: 'OpenID',
    authOpenIDAutoLaunch: false,
    authOpenIDAutoRegister: false,
    authOpenIDMobileRedirectURIs: uris
  }
}

function redirectUriErrors(uris: string[]) {
  return validateOpenIdSettings(settingsWithRedirectUris(uris)).filter((error) => error.startsWith('Mobile Redirect URIs'))
}

describe('mobile redirect URI validation', () => {
  it('accepts custom-scheme and https paths', () => {
    expect(
      redirectUriErrors(['audiobookshelf://oauth', 'https://example.com/foo/bar.json', 'myapp://host/foo-bar/', 'custom://my-app.example/callback'])
    ).to.deep.equal([])
  })

  it('rejects invalid URIs', () => {
    expect(redirectUriErrors(['not-a-uri'])).to.deep.equal(['Mobile Redirect URIs: Invalid URI not-a-uri'])
    expect(redirectUriErrors(['https://example.com/foo?x=1'])).to.deep.equal(['Mobile Redirect URIs: Invalid URI https://example.com/foo?x=1'])
  })

  it('rejects a ReDoS-shaped URI without exponential backtracking', () => {
    const uri = `a://-/${'/'.repeat(28)}!`
    const started = performance.now()
    expect(redirectUriErrors([uri])).to.deep.equal([`Mobile Redirect URIs: Invalid URI ${uri}`])
    expect(performance.now() - started).to.be.lessThan(50)
  })
})
