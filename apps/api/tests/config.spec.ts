import { describe, expect, it } from 'vitest'

import { normalizeCallbackUrl, resolveAppConfig } from '../src/infra/config.js'

describe('config normalization', () => {
  it('forces the callback path to /auth/callback', () => {
    expect(normalizeCallbackUrl('http://localhost:5173', 'http://localhost:5173')).toBe(
      'http://localhost:5173/auth/callback'
    )
  })

  it('keeps the base path when normalizing callback URLs', () => {
    expect(
      normalizeCallbackUrl('http://localhost:5173/app/anything', 'http://localhost:5173', '/app/')
    ).toBe('http://localhost:5173/app/auth/callback')
  })

  it('normalizes origins and ignores empty env values', () => {
    expect(
      resolveAppConfig({
        WEB_ORIGIN: 'http://localhost:5173/',
        API_ORIGIN: '',
        PORT: '',
        VITE_SSO_URL: 'https://sso-web.example.test',
        VITE_BASE_URL: '/app/'
      })
    ).toMatchObject({
      webOrigin: 'http://localhost:5173',
      apiOrigin: 'http://localhost:3001',
      port: 3001,
      ssoBrowserUrl: 'https://sso-web.example.test',
      ssoRedirect: 'http://localhost:5173/app/auth/callback'
    })
  })

  it('fails fast on malformed explicit origins', () => {
    expect(() =>
      resolveAppConfig({
        WEB_ORIGIN: 'localhost:5173,https://example.com'
      })
    ).toThrow()
  })
})
