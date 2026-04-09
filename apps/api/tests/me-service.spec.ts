import { describe, expect, it } from 'vitest'

import type { AuthenticatedSessionDto } from '@note/shared-types'

import {
  createMeService,
  createPrismaMeRepository,
  type MeRepository
} from '../src/services/me-service.js'
import type { PrismaTransactionalClientLike } from '../src/services/prisma-client.js'

interface FakeTransactionClient {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>
}

function createSession(userId = '1001'): AuthenticatedSessionDto {
  return {
    status: 'authenticated',
    user: {
      id: userId,
      displayName: 'Demo User'
    }
  }
}

describe('me service', () => {
  it('clamps oversized page numbers before hitting the repository', async () => {
    let receivedPage = 0
    const repository: MeRepository = {
      async getCreatedNotesPage(_userId, page) {
        receivedPage = page

        return {
          rows: [],
          total: 0
        }
      },
      async getFavoriteNotesPage() {
        return {
          rows: [],
          total: 0
        }
      },
      async transaction(callback) {
        return callback({
          async $queryRawUnsafe<T = unknown>(_query: string, ..._values: unknown[]) {
            return [] as T
          },
          async $executeRawUnsafe(_query: string, ..._values: unknown[]) {
            return 0
          }
        })
      }
    }
    const service = createMeService(repository, {
      async ensureBySsoId() {
        return {
          id: 7,
          ssoId: 1001n
        }
      },
      async findBySsoId() {
        throw new Error('me service should not call findBySsoId')
      }
    })

    await expect(service.getMyNotes({
      page: 999_999,
      limit: 20
    }, createSession())).resolves.toMatchObject({
      status: 'success',
      response: {
        page: 10000,
        limit: 20
      }
    })
    expect(receivedPage).toBe(10000)
  })

  it('loads rows and total from the same transaction snapshot', async () => {
    const querySources: string[] = []
    const transactionClient: FakeTransactionClient = {
      async $queryRawUnsafe<T = unknown>(sql: string, ...values: unknown[]) {
        querySources.push(`tx:${sql}`)

        if (sql.includes('COUNT(*) AS total')) {
          expect(values).toEqual(['7'])
          return [{ total: 2 }] as T
        }

        expect(values).toEqual(['7', 10, 10])
        return [
          {
            id: 42,
            sid: 'owned123',
            content: '第一页内容',
            updatedAt: '2026-04-07T10:00:00.000Z'
          }
        ] as T
      },
      async $executeRawUnsafe() {
        throw new Error('me repository should not execute raw writes')
      }
    }
    const prismaClient = {
      async $queryRawUnsafe<T = unknown>() {
        querySources.push('root')
        return [] as T
      },
      async $executeRawUnsafe() {
        throw new Error('me repository should not execute raw writes')
      },
      async $transaction<T>(
        callback: (transactionClient: FakeTransactionClient) => Promise<T>
      ) {
        return callback(transactionClient)
      }
    }
    const repository = createPrismaMeRepository({
      getPrismaClient: async () => prismaClient
    })

    await expect(repository.getCreatedNotesPage(7, 2, 10)).resolves.toEqual({
      rows: [
        {
          id: 42,
          sid: 'owned123',
          content: '第一页内容',
          updatedAt: '2026-04-07T10:00:00.000Z'
        }
      ],
      total: 2
    })
    expect(querySources).toHaveLength(2)
    expect(querySources.every((source) => source.startsWith('tx:'))).toBe(true)
  })

  it('ensures an internal user mapping before querying created notes', async () => {
    let ensuredUserId: bigint | null = null
    let receivedUserId = 0
    const transactionClient: PrismaTransactionalClientLike = {
      async $queryRawUnsafe<T = unknown>(_query: string, ..._values: unknown[]) {
        return [] as T
      },
      async $executeRawUnsafe(_query: string, ..._values: unknown[]) {
        return 0
      }
    }
    const repository: MeRepository = {
      async getCreatedNotesPage(userId) {
        receivedUserId = Number(userId)

        return {
          rows: [],
          total: 0
        }
      },
      async getFavoriteNotesPage() {
        return {
          rows: [],
          total: 0
        }
      },
      async transaction(callback) {
        return callback(transactionClient)
      }
    }
    const service = createMeService(repository, {
      async ensureBySsoId(ssoId) {
        ensuredUserId = ssoId

        return {
          id: 77,
          ssoId
        }
      },
      async findBySsoId() {
        throw new Error('me service should not call findBySsoId')
      }
    })

    await expect(service.getMyNotes(undefined, createSession())).resolves.toEqual({
      status: 'success',
      response: {
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      }
    })
    expect(ensuredUserId).toBe(1001n)
    expect(receivedUserId).toBe(77)
  })

  it('keeps deleted filtering and stable sort in the created-notes lookup query', async () => {
    let lookupQuery = ''
    const transactionClient: FakeTransactionClient = {
      async $queryRawUnsafe<T = unknown>(sql: string, ...values: unknown[]) {
        if (sql.includes('SELECT id, sid, content, updated_at AS updatedAt')) {
          lookupQuery = sql
          expect(values).toEqual(['7', 20, 0])
          return [] as T
        }

        return [{ total: 0 }] as T
      },
      async $executeRawUnsafe() {
        throw new Error('me repository should not execute raw writes')
      }
    }
    const prismaClient = {
      async $queryRawUnsafe<T = unknown>(_query: string, ..._values: unknown[]) {
        return [] as T
      },
      async $executeRawUnsafe(_query: string, ..._values: unknown[]) {
        throw new Error('me repository should not execute raw writes')
      },
      async $transaction<T>(
        callback: (nextTransactionClient: FakeTransactionClient) => Promise<T>
      ) {
        return callback(transactionClient)
      }
    }
    const repository = createPrismaMeRepository({
      getPrismaClient: async () => prismaClient
    })

    await repository.getCreatedNotesPage(7, 1, 20)

    expect(lookupQuery).toContain('WHERE author_id = ? AND deleted_at IS NULL')
    expect(lookupQuery).toContain('ORDER BY updated_at DESC, id DESC')
  })

  it('maps favorite relation timestamps separately from note update timestamps', async () => {
    let ensuredUserId: bigint | null = null
    let receivedUserId = 0
    const transactionClient: PrismaTransactionalClientLike = {
      async $queryRawUnsafe<T = unknown>(_query: string, ..._values: unknown[]) {
        return [] as T
      },
      async $executeRawUnsafe(_query: string, ..._values: unknown[]) {
        return 0
      }
    }
    const repository: MeRepository = {
      async getCreatedNotesPage() {
        return {
          rows: [],
          total: 0
        }
      },
      async getFavoriteNotesPage(userId) {
        receivedUserId = Number(userId)

        return {
          rows: [
            {
              noteId: 41,
              sid: 'shared123',
              content: '收藏正文',
              updatedAt: '2026-04-09T09:00:00.000Z',
              favoritedAt: '2026-04-08T08:30:00.000Z'
            }
          ],
          total: 1
        }
      },
      async transaction(callback) {
        return callback(transactionClient)
      }
    }
    const service = createMeService(repository, {
      async ensureBySsoId(ssoId) {
        ensuredUserId = ssoId

        return {
          id: 88,
          ssoId
        }
      },
      async findBySsoId() {
        throw new Error('me service should not call findBySsoId')
      }
    })

    await expect(service.getMyFavorites(undefined, createSession())).resolves.toEqual({
      status: 'success',
      response: {
        items: [
          {
            sid: 'shared123',
            preview: '收藏正文',
            updatedAt: '2026-04-09T09:00:00.000Z',
            favoritedAt: '2026-04-08T08:30:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      }
    })
    expect(ensuredUserId).toBe(1001n)
    expect(receivedUserId).toBe(88)
  })

  it('keeps deleted filtering and favorite-recency sort in the favorites lookup query', async () => {
    let lookupQuery = ''
    const transactionClient: FakeTransactionClient = {
      async $queryRawUnsafe<T = unknown>(sql: string, ...values: unknown[]) {
        if (sql.includes('favorite.created_at AS favoritedAt')) {
          lookupQuery = sql
          expect(values).toEqual(['7', 20, 0])
          return [] as T
        }

        return [{ total: 0 }] as T
      },
      async $executeRawUnsafe() {
        throw new Error('me repository should not execute raw writes')
      }
    }
    const prismaClient = {
      async $queryRawUnsafe<T = unknown>(_query: string, ..._values: unknown[]) {
        return [] as T
      },
      async $executeRawUnsafe(_query: string, ..._values: unknown[]) {
        throw new Error('me repository should not execute raw writes')
      },
      async $transaction<T>(
        callback: (nextTransactionClient: FakeTransactionClient) => Promise<T>
      ) {
        return callback(transactionClient)
      }
    }
    const repository = createPrismaMeRepository({
      getPrismaClient: async () => prismaClient
    })

    await repository.getFavoriteNotesPage(7, 1, 20)

    expect(lookupQuery).toContain('FROM note_favorites AS favorite')
    expect(lookupQuery).toContain('INNER JOIN notes ON notes.id = favorite.note_id')
    expect(lookupQuery).toContain('notes.deleted_at IS NULL')
    expect(lookupQuery).toContain('ORDER BY favorite.created_at DESC, favorite.note_id DESC')
  })
})
