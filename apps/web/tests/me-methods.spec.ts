import { describe, expect, it, vi } from 'vitest'

const getMock = vi.hoisted(() =>
  vi.fn((url: string, options: Record<string, unknown>) => ({
    url,
    options
  }))
)

vi.mock('../src/services/http-client', () => ({
  alovaClient: {
    Get: getMock
  }
}))

import {
  createGetMyFavoritesMethod,
  createGetMyNotesMethod,
  invalidateMyFavoritesCacheForUser,
  invalidateMyNotesCacheForUser
} from '../src/services/me-methods'

describe('me methods', () => {
  it('scopes the my-notes cache key by authenticated user identity', () => {
    createGetMyNotesMethod({ page: 2, limit: 10 }, 'user:1001')

    expect(getMock).toHaveBeenCalledWith('/api/me/notes', {
      params: {
        page: 2,
        limit: 10
      },
      name: 'me-notes:user:1001:r0:2:10',
      cacheFor: 30 * 1000
    })
  })

  it('bumps the cache revision after invalidating a user created-notes cache', () => {
    invalidateMyNotesCacheForUser('1001')
    createGetMyNotesMethod({ page: 1, limit: 20 }, 'user:1001')

    expect(getMock).toHaveBeenLastCalledWith('/api/me/notes', {
      params: {
        page: 1,
        limit: 20
      },
      name: 'me-notes:user:1001:r1:1:20',
      cacheFor: 30 * 1000
    })
  })

  it('scopes the my-favorites cache key by authenticated user identity', () => {
    createGetMyFavoritesMethod({ page: 2, limit: 10 }, 'user:1001')

    expect(getMock).toHaveBeenCalledWith('/api/me/favorites', {
      params: {
        page: 2,
        limit: 10
      },
      name: 'me-favorites:user:1001:r0:2:10',
      cacheFor: 30 * 1000
    })
  })

  it('bumps the cache revision after invalidating a user favorites cache', () => {
    invalidateMyFavoritesCacheForUser('1001')
    createGetMyFavoritesMethod({ page: 1, limit: 20 }, 'user:1001')

    expect(getMock).toHaveBeenLastCalledWith('/api/me/favorites', {
      params: {
        page: 1,
        limit: 20
      },
      name: 'me-favorites:user:1001:r1:1:20',
      cacheFor: 30 * 1000
    })
  })
})
