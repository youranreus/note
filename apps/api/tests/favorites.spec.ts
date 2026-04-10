import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'
import type { FavoriteService, FavoriteServiceResult } from '../src/services/favorite-service.js'
import { createAuthSessionService } from '../src/services/auth-session-service.js'

function createFakeFavoriteService(): FavoriteService {
  return {
    async favoriteBySid(sid, session): Promise<FavoriteServiceResult> {
      if (!session) {
        return {
          status: 'unauthorized',
          error: {
            sid,
            code: 'FAVORITE_AUTH_REQUIRED',
            status: 'unauthorized',
            message: '收藏前请先完成登录。'
          }
        }
      }

      if (sid === 'owned123') {
        return {
          status: 'forbidden',
          error: {
            sid,
            code: 'FAVORITE_SELF_OWNED_NOT_ALLOWED',
            status: 'forbidden',
            message: '自己创建的便签不需要再收藏。'
          }
        }
      }

      if (sid === 'missing123') {
        return {
          status: 'not-found',
          error: {
            sid,
            code: 'FAVORITE_NOTE_NOT_FOUND',
            status: 'not-found',
            message: '未找到可收藏的在线便签。'
          }
        }
      }

      if (sid === 'deleted123') {
        return {
          status: 'deleted',
          error: {
            sid,
            code: 'FAVORITE_NOTE_DELETED',
            status: 'deleted',
            message: '这条在线便签已删除，当前无法加入收藏。'
          }
        }
      }

      return {
        status: 'favorited',
        favorite: {
          sid,
          favoriteState: 'favorited'
        }
      }
    }
  }
}

describe('favorites endpoint', () => {
  const authSessionService = createAuthSessionService({
    sessionTtlSeconds: 600
  })
  const sessionCookie = `sid=${authSessionService.createSession({
    id: '1001',
    displayName: 'Receiver'
  })}`

  it('rejects anonymous favorite requests with a stable auth-required error', async () => {
    const app = buildApp({
      authSessionService,
      favoriteService: createFakeFavoriteService()
    })

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/favorites',
        payload: {
          sid: 'shared123'
        }
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        sid: 'shared123',
        code: 'FAVORITE_AUTH_REQUIRED',
        status: 'unauthorized',
        message: '收藏前请先完成登录。'
      })
    } finally {
      await app.close()
    }
  })

  it('returns a favorited result for logged-in users and keeps duplicate submissions idempotent', async () => {
    const app = buildApp({
      authSessionService,
      favoriteService: createFakeFavoriteService()
    })

    try {
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/favorites',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          sid: 'shared123'
        }
      })
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/favorites',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          sid: 'shared123'
        }
      })

      expect(firstResponse.statusCode).toBe(200)
      expect(firstResponse.json()).toEqual({
        sid: 'shared123',
        favoriteState: 'favorited'
      })
      expect(secondResponse.statusCode).toBe(200)
      expect(secondResponse.json()).toEqual({
        sid: 'shared123',
        favoriteState: 'favorited'
      })
    } finally {
      await app.close()
    }
  })

  it('returns a stable deleted response when the target favorite sid has already been deleted', async () => {
    const app = buildApp({
      authSessionService,
      favoriteService: createFakeFavoriteService()
    })

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/favorites',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          sid: 'deleted123'
        }
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        sid: 'deleted123',
        code: 'FAVORITE_NOTE_DELETED',
        status: 'deleted',
        message: '这条在线便签已删除，当前无法加入收藏。'
      })
    } finally {
      await app.close()
    }
  })
})
