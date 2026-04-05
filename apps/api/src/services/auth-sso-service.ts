import { UserAPI } from '@reus-able/sso-utils'

import type { AuthCallbackErrorCode, AuthUserDto } from '@note/shared-types'

import type { AppConfig } from '../infra/config.js'

export class AuthSsoServiceError extends Error {
  code: AuthCallbackErrorCode

  constructor(code: AuthCallbackErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthSsoServiceError'
  }
}

export interface AuthSsoService {
  buildAuthorizeUrl: (input: { state: string }) => string
  exchangeCode: (code: string) => Promise<AuthUserDto>
}

interface SsoEnvelope {
  code?: unknown
  data?: unknown
  msg?: unknown
}

function readFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function readFirstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

function resolveAuthorizationHeader(payload: unknown) {
  const tokenPayload = unwrapSsoPayload(payload)

  if (typeof tokenPayload === 'string' && tokenPayload.trim()) {
    return tokenPayload.trim()
  }

  if (!tokenPayload || typeof tokenPayload !== 'object') {
    return null
  }

  const tokenRecord = tokenPayload as Record<string, unknown>
  const accessToken = readFirstString(
    tokenRecord.access_token,
    tokenRecord.accessToken,
    tokenRecord.token
  )

  if (!accessToken) {
    return null
  }

  const tokenType = readFirstString(tokenRecord.token_type, tokenRecord.tokenType)

  return tokenType ? `${tokenType} ${accessToken}` : accessToken
}

function resolveAuthUser(payload: unknown) {
  const unwrappedPayload = unwrapSsoPayload(payload)

  if (!unwrappedPayload || typeof unwrappedPayload !== 'object') {
    return null
  }

  const source = unwrappedPayload as Record<string, unknown>
  const userCandidate =
    source.user && typeof source.user === 'object'
      ? (source.user as Record<string, unknown>)
      : source

  const id = readFirstText(
    userCandidate.id,
    userCandidate.userId,
    userCandidate.ssoId,
    userCandidate.uid,
    userCandidate.username,
    userCandidate.email
  )

  if (!id) {
    return null
  }

  const displayName =
    readFirstString(
      userCandidate.displayName,
      userCandidate.name,
      userCandidate.nickname,
      userCandidate.username
    ) ?? id

  return {
    id,
    displayName
  }
}

function resolveSsoEnvelope(payload: unknown): SsoEnvelope | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload as SsoEnvelope
}

function unwrapSsoPayload(payload: unknown) {
  const envelope = resolveSsoEnvelope(payload)

  if (!envelope || !('data' in envelope)) {
    return payload
  }

  if (typeof envelope.code === 'number' && envelope.code !== 200 && envelope.code !== 0) {
    const errorMessage = readFirstString(envelope.msg) ?? 'SSO 服务返回了未预期的错误响应。'
    throw new AuthSsoServiceError('AUTH_CALLBACK_FAILED', errorMessage)
  }

  return envelope.data
}

function resolveMockUser(code: string, config: AppConfig) {
  if (!config.ssoMockEnabled || !code.startsWith(config.ssoMockTicketPrefix)) {
    return null
  }

  const segments = code.slice(config.ssoMockTicketPrefix.length).split(':')
  const id = readFirstString(segments[0])

  if (!id) {
    throw new AuthSsoServiceError('AUTH_CALLBACK_FAILED', 'Mock SSO code 缺少用户标识。')
  }

  const displayName = readFirstString(
    segments[1] ? decodeURIComponent(segments[1]) : undefined
  ) ?? `Mock User ${id}`

  return {
    id,
    displayName
  }
}

export function createAuthSsoService(config: AppConfig): AuthSsoService {
  const ssoClient = UserAPI({
    SSO_ID: config.ssoId,
    SSO_REDIRECT: config.ssoRedirect,
    SSO_SECRET: config.ssoSecret,
    SSO_URL: config.ssoUrl
  })

  return {
    buildAuthorizeUrl({ state }) {
      const authorizeUrl = new URL('/oauth/authorize', config.ssoBrowserUrl)
      authorizeUrl.searchParams.set('client_id', config.ssoId)
      authorizeUrl.searchParams.set('redirect_uri', config.ssoRedirect)
      authorizeUrl.searchParams.set('state', state)
      return authorizeUrl.toString()
    },
    async exchangeCode(code) {
      const mockUser = resolveMockUser(code, config)

      if (mockUser) {
        return mockUser
      }

      try {
        const tokenResponse = await ssoClient.authorizeToken(code)
        const authorizationHeader = resolveAuthorizationHeader(tokenResponse.data)

        if (!authorizationHeader) {
          throw new AuthSsoServiceError(
            'AUTH_CALLBACK_FAILED',
            'SSO token 响应缺少可用的访问凭据。'
          )
        }

        const userResponse = await ssoClient.getUserInfo(authorizationHeader)
        const user = resolveAuthUser(userResponse.data)

        if (!user) {
          throw new AuthSsoServiceError(
            'AUTH_CALLBACK_FAILED',
            'SSO userinfo 响应缺少最小身份字段。'
          )
        }

        return user
      } catch (error) {
        if (error instanceof AuthSsoServiceError) {
          throw error
        }

        throw new AuthSsoServiceError(
          'AUTH_CALLBACK_FAILED',
          'SSO 回调处理失败，请稍后重试或联系管理员。'
        )
      }
    }
  }
}
