import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'
import type { MeService, MyNotesServiceResult } from '../src/services/me-service.js'
import { createAuthSessionService } from '../src/services/auth-session-service.js'

function createFakeMeService(): MeService {
  return {
    async getMyNotes(_query, session): Promise<MyNotesServiceResult> {
      if (!session) {
        return {
          status: 'unauthorized',
          error: {
            code: 'ME_AUTH_REQUIRED',
            status: 'unauthorized',
            message: '查看我的创建前请先完成登录。'
          }
        }
      }

      if (session.user.id === '2002') {
        return {
          status: 'success',
          response: {
            items: [],
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false
          }
        }
      }

      return {
        status: 'success',
        response: {
          items: [
            {
              sid: 'beta456',
              preview: '第二条便签',
              updatedAt: '2026-04-07T10:00:00.000Z'
            },
            {
              sid: 'alpha123',
              preview: '第一条便签',
              updatedAt: '2026-04-06T09:00:00.000Z'
            }
          ],
          page: 1,
          limit: 20,
          total: 2,
          hasMore: false
        }
      }
    }
  }
}

describe('me notes endpoint', () => {
  const authSessionService = createAuthSessionService({
    sessionTtlSeconds: 600
  })
  const sessionCookie = `sid=${authSessionService.createSession({
    id: '1001',
    displayName: 'Owner'
  })}`
  const emptySessionCookie = `sid=${authSessionService.createSession({
    id: '2002',
    displayName: 'Empty Owner'
  })}`

  it('rejects anonymous requests with a stable auth-required error', async () => {
    const app = buildApp({
      authSessionService,
      meService: createFakeMeService()
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/me/notes'
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        code: 'ME_AUTH_REQUIRED',
        status: 'unauthorized',
        message: '查看我的创建前请先完成登录。'
      })
    } finally {
      await app.close()
    }
  })

  it('returns only the current user created notes ordered by recency', async () => {
    const app = buildApp({
      authSessionService,
      meService: createFakeMeService()
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/me/notes?page=1&limit=20',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        items: [
          {
            sid: 'beta456',
            preview: '第二条便签',
            updatedAt: '2026-04-07T10:00:00.000Z'
          },
          {
            sid: 'alpha123',
            preview: '第一条便签',
            updatedAt: '2026-04-06T09:00:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 2,
        hasMore: false
      })
    } finally {
      await app.close()
    }
  })

  it('returns a stable empty success response when the user has no created notes', async () => {
    const app = buildApp({
      authSessionService,
      meService: createFakeMeService()
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/me/notes',
        headers: {
          cookie: emptySessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      })
    } finally {
      await app.close()
    }
  })
})
