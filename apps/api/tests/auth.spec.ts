import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { buildApp } from '../src/app.js'
import { resolveAppConfig } from '../src/infra/config.js'
import type { AuthSsoService } from '../src/services/auth-sso-service.js'

function createFakeAuthSsoService(browserUrl: string): AuthSsoService {
  return {
    buildAuthorizeUrl({ state }) {
      return `${browserUrl}/oauth/authorize?client_id=note-web&state=${state}`
    },
    async exchangeCode(code) {
      if (code !== 'valid-code') {
        throw new Error('SSO code exchange failed.')
      }

      return {
        id: '1001',
        ssoId: '1001',
        displayName: 'Demo User',
        avatarUrl: null
      }
    }
  }
}

function readCookie(setCookieHeader: string | string[] | undefined, cookieName: string) {
  const headerValues = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : []

  const matchedCookie = headerValues.find((value) => value.startsWith(`${cookieName}=`))

  if (!matchedCookie) {
    throw new Error(`Missing cookie ${cookieName}`)
  }

  return matchedCookie.split(';', 1)[0]
}

describe('auth endpoints', () => {
  const config = resolveAppConfig({
    API_ORIGIN: 'http://localhost:3001',
    COOKIE_NAME: 'note_session',
    COOKIE_SECURE: 'false',
    SESSION_TTL_SECONDS: '600',
    SSO_ID: 'note-web',
    SSO_REDIRECT: 'http://localhost:5173/auth/callback',
    SSO_URL: 'https://sso-api.example.test',
    VITE_SSO_URL: 'https://sso-web.example.test',
    WEB_ORIGIN: 'http://localhost:5173'
  })
  const app = buildApp({
    authSsoService: createFakeAuthSsoService(config.ssoBrowserUrl),
    config
  })

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('starts the SSO login flow with a stateful redirect and flow cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/login?returnTo=/o/demo123'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toContain('https://sso-web.example.test/oauth/authorize')
    expect(new URL(response.headers.location ?? '').searchParams.get('state')).toBeTruthy()
    expect(readCookie(response.headers['set-cookie'], 'note_session_flow')).toContain(
      'note_session_flow='
    )
  })

  it('creates a session from the callback and exposes it through /api/me/session', async () => {
    const loginResponse = await app.inject({
      method: 'GET',
      url: '/api/auth/login?returnTo=/o/demo123'
    })
    const flowCookie = readCookie(loginResponse.headers['set-cookie'], 'note_session_flow')
    const state = new URL(loginResponse.headers.location ?? '').searchParams.get('state')

    const callbackResponse = await app.inject({
      method: 'GET',
      url: `/api/auth/callback?code=valid-code&state=${state}`,
      headers: {
        cookie: flowCookie
      }
    })

    expect(callbackResponse.statusCode).toBe(200)
    expect(callbackResponse.json()).toEqual({
      status: 'authenticated',
      user: {
        id: '1001',
        ssoId: '1001',
        displayName: 'Demo User',
        avatarUrl: null
      },
      returnTo: '/o/demo123',
      postLoginAction: null,
      message: '登录已完成，正在恢复原页面上下文。'
    })

    const sessionCookie = readCookie(callbackResponse.headers['set-cookie'], 'note_session')
    const sessionResponse = await app.inject({
      method: 'GET',
      url: '/api/me/session',
      headers: {
        cookie: sessionCookie
      }
    })

    expect(sessionResponse.statusCode).toBe(200)
    expect(sessionResponse.json()).toEqual({
      status: 'authenticated',
      user: {
        id: '1001',
        ssoId: '1001',
        displayName: 'Demo User',
        avatarUrl: null
      }
    })
  })

  it('logs the login flow start and success with route-safe metadata', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    try {
      const loginResponse = await app.inject({
        method: 'GET',
        url: '/api/auth/login?returnTo=/o/demo123'
      })
      const flowCookie = readCookie(loginResponse.headers['set-cookie'], 'note_session_flow')
      const state = new URL(loginResponse.headers.location ?? '').searchParams.get('state')

      const callbackResponse = await app.inject({
        method: 'GET',
        url: `/api/auth/callback?code=valid-code&state=${state}`,
        headers: {
          cookie: flowCookie
        }
      })

      expect(callbackResponse.statusCode).toBe(200)
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('登录流程已启动，完成后将返回 /o/demo123。')
      )
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('用户(1***1) 登录成功，将返回 /o/demo123。')
      )
    } finally {
      consoleInfo.mockRestore()
    }
  })

  it('returns a stable validation error when the callback code is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/callback?state=missing-code'
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      status: 'error',
      code: 'AUTH_CODE_MISSING'
    })
  })

  it('returns a stable validation error when the callback state is invalid', async () => {
    const loginResponse = await app.inject({
      method: 'GET',
      url: '/api/auth/login?returnTo=/l/demo123'
    })
    const flowCookie = readCookie(loginResponse.headers['set-cookie'], 'note_session_flow')

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/callback?code=valid-code&state=unexpected-state',
      headers: {
        cookie: flowCookie
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      status: 'error',
      code: 'AUTH_STATE_INVALID'
    })
  })

  it('keeps /api/me/session anonymous when no authenticated cookie exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/me/session'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'anonymous'
    })
  })

  it('preserves a favorite intent through the login callback and returns it exactly once', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    try {
      const loginResponse = await app.inject({
        method: 'GET',
        url: '/api/auth/login?returnTo=/o/demo123&intent=favorite-note&sid=demo123'
      })
      const flowCookie = readCookie(loginResponse.headers['set-cookie'], 'note_session_flow')
      const state = new URL(loginResponse.headers.location ?? '').searchParams.get('state')

      const callbackResponse = await app.inject({
        method: 'GET',
        url: `/api/auth/callback?code=valid-code&state=${state}`,
        headers: {
          cookie: flowCookie
        }
      })

      expect(callbackResponse.statusCode).toBe(200)
      expect(callbackResponse.json()).toEqual({
        status: 'authenticated',
        user: {
          id: '1001',
          ssoId: '1001',
          displayName: 'Demo User',
          avatarUrl: null
        },
        returnTo: '/o/demo123',
        postLoginAction: {
          type: 'favorite-note',
          sid: 'demo123'
        },
        message: '登录已完成，正在恢复原页面上下文。'
      })
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('登录流程已启动，完成后将返回 /o/demo123，登录后将继续收藏便签(dem...123)。')
      )
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('用户(1***1) 登录成功，将返回 /o/demo123，登录后将继续收藏便签(dem...123)。')
      )
    } finally {
      consoleInfo.mockRestore()
    }
  })
})
