import * as oidc from 'openid-client'
import type { AuthUserDto } from '@note/shared-types'
import type { AppConfig } from '../infra/config.js'

export class AuthSsoServiceError extends Error {
  code: 'AUTH_CALLBACK_FAILED'
  constructor(message: string) {
    super(message)
    this.code = 'AUTH_CALLBACK_FAILED'
    this.name = 'AuthSsoServiceError'
  }
}

export interface AuthSsoService {
  buildAuthorizeUrl: (input: { state: string; nonce: string; codeVerifier: string }) => string | Promise<string>
  exchangeCode: (input: string | { code: string; state: string; nonce: string; codeVerifier: string }) => Promise<AuthUserDto>
}

function claimString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function createAuthSsoService(config: AppConfig): AuthSsoService {
  let configurationPromise: Promise<oidc.Configuration> | undefined
  const getConfiguration = () => {
    configurationPromise ??= oidc.discovery(new URL(config.oidcIssuer), config.oidcClientId, undefined, oidc.None())
    return configurationPromise
  }

  return {
    async buildAuthorizeUrl({ state, nonce, codeVerifier }) {
      try {
        const configuration = await getConfiguration()
        const challenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
        return oidc.buildAuthorizationUrl(configuration, {
          redirect_uri: config.oidcRedirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          state,
          nonce,
          code_challenge: challenge,
          code_challenge_method: 'S256'
        }).toString()
      } catch {
        throw new AuthSsoServiceError('OIDC discovery or authorization URL construction failed.')
      }
    },
    async exchangeCode(input) {
      const { code, state, nonce, codeVerifier } = typeof input === 'string'
        ? { code: input, state: '', nonce: '', codeVerifier: '' }
        : input
      if (config.ssoMockEnabled && code.startsWith(config.ssoMockTicketPrefix)) {
        const id = claimString(code.slice(config.ssoMockTicketPrefix.length).split(':')[0])
        if (!id || !/^\d+$/u.test(id)) throw new AuthSsoServiceError('Mock OIDC code is invalid.')
        return { id, ssoId: id, displayName: `Mock User ${id}`, avatarUrl: null }
      }
      try {
        const configuration = await getConfiguration()
        const callbackUrl = new URL(`${config.oidcRedirectUri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
        const tokens = await oidc.authorizationCodeGrant(configuration, callbackUrl, {
          pkceCodeVerifier: codeVerifier,
          expectedState: state,
          expectedNonce: nonce
        })
        const claims = tokens.claims()
        const sub = claimString(claims?.sub)
        if (!sub || !/^\d+$/u.test(sub)) {
          throw new AuthSsoServiceError('OIDC ID token sub must match the numeric SSO user id.')
        }
        const displayName = claimString(claims?.name) ?? claimString(claims?.preferred_username) ?? claimString(claims?.email) ?? sub
        const avatarUrl = claimString(claims?.picture)
        return { id: sub, ssoId: sub, displayName, avatarUrl }
      } catch (error) {
        if (error instanceof AuthSsoServiceError) throw error
        throw new AuthSsoServiceError('OIDC callback validation failed.')
      }
    }
  }
}
