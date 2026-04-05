import { beforeEach, describe, expect, it, vi } from 'vitest'

const userApiMocks = vi.hoisted(() => ({
  authorizeToken: vi.fn(),
  getRedirectLink: vi.fn(),
  getUserInfo: vi.fn()
}))

vi.mock('@reus-able/sso-utils', () => ({
  UserAPI: vi.fn(() => ({
    authorizeToken: userApiMocks.authorizeToken,
    getRedirectLink: userApiMocks.getRedirectLink,
    getUserInfo: userApiMocks.getUserInfo
  }))
}))

import { resolveAppConfig } from '../src/infra/config.js'
import { createAuthSsoService } from '../src/services/auth-sso-service.js'

describe('auth sso service', () => {
  beforeEach(() => {
    userApiMocks.authorizeToken.mockReset()
    userApiMocks.getRedirectLink.mockReset()
    userApiMocks.getUserInfo.mockReset()
  })

  it('unwraps token and user payloads from the documented data envelope', async () => {
    const config = resolveAppConfig({
      SSO_ID: 'note-web',
      SSO_REDIRECT: 'http://localhost:5173/auth/callback',
      SSO_URL: 'https://sso-api.example.test',
      VITE_SSO_URL: 'https://sso-web.example.test'
    })
    const service = createAuthSsoService(config)

    userApiMocks.authorizeToken.mockResolvedValue({
      data: {
        code: 200,
        msg: 'ok',
        data: {
          access_token: 'access-token',
          token_type: 'Bearer',
          scope: '*'
        }
      }
    })
    userApiMocks.getUserInfo.mockResolvedValue({
      data: {
        code: 200,
        msg: 'ok',
        data: {
          id: 1001,
          nickname: 'demo_user',
          email: 'demo@example.com'
        }
      }
    })

    const user = await service.exchangeCode('real-code')

    expect(userApiMocks.getUserInfo).toHaveBeenCalledWith('Bearer access-token')
    expect(user).toEqual({
      id: '1001',
      displayName: 'demo_user'
    })
  })

  it('maps non-success envelope codes to a stable callback error', async () => {
    const config = resolveAppConfig({
      SSO_ID: 'note-web',
      SSO_REDIRECT: 'http://localhost:5173/auth/callback',
      SSO_URL: 'https://sso-api.example.test',
      VITE_SSO_URL: 'https://sso-web.example.test'
    })
    const service = createAuthSsoService(config)

    userApiMocks.authorizeToken.mockResolvedValue({
      data: {
        code: 401,
        msg: 'invalid code',
        data: null
      }
    })

    await expect(service.exchangeCode('bad-code')).rejects.toMatchObject({
      code: 'AUTH_CALLBACK_FAILED',
      message: 'invalid code'
    })
  })
})
