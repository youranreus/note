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

import { createGetMyNotesMethod } from '../src/services/me-methods'

describe('me methods', () => {
  it('scopes the my-notes cache key by authenticated user identity', () => {
    createGetMyNotesMethod({ page: 2, limit: 10 }, 'user:1001')

    expect(getMock).toHaveBeenCalledWith('/api/me/notes', {
      params: {
        page: 2,
        limit: 10
      },
      name: 'me-notes:user:1001:2:10',
      cacheFor: 30 * 1000
    })
  })
})
