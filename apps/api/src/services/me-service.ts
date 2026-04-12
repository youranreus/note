import type {
  AuthenticatedSessionDto,
  MeErrorDto,
  MyFavoritesResponseDto,
  MyNotesQueryDto,
  MyNotesResponseDto
} from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaQueryClientLike,
  type PrismaTransactionalClientLike
} from './prisma-client.js'
import {
  createPrismaUserRepository,
  normalizeAuthSessionSsoId,
  toBigInt,
  type UserRepository
} from './user-service.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const MAX_PAGE = 10_000

const createdNotesLookupSql = `
  SELECT id, sid, content, updated_at AS updatedAt
  FROM notes
  WHERE author_id = ? AND deleted_at IS NULL
  ORDER BY updated_at DESC, id DESC
  LIMIT ? OFFSET ?
`
const createdNotesCountSql = `
  SELECT COUNT(*) AS total
  FROM notes
  WHERE author_id = ? AND deleted_at IS NULL
`
const favoriteNotesLookupSql = `
  SELECT
    favorite.note_id AS noteId,
    notes.sid AS sid,
    notes.content AS content,
    notes.updated_at AS updatedAt,
    favorite.created_at AS favoritedAt
  FROM note_favorites AS favorite
  INNER JOIN notes ON notes.id = favorite.note_id
  WHERE favorite.user_id = ? AND notes.deleted_at IS NULL
  ORDER BY favorite.created_at DESC, favorite.note_id DESC
  LIMIT ? OFFSET ?
`
const favoriteNotesCountSql = `
  SELECT COUNT(*) AS total
  FROM note_favorites AS favorite
  INNER JOIN notes ON notes.id = favorite.note_id
  WHERE favorite.user_id = ? AND notes.deleted_at IS NULL
`

interface PrismaMeRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

interface MyNoteRow {
  id: number | bigint
  sid: string
  content: string
  updatedAt: Date | string
}

interface MyFavoriteRow {
  noteId: number | bigint
  sid: string
  content: string
  updatedAt: Date | string
  favoritedAt: Date | string
}

interface CountRow {
  total: number | bigint
}

export interface MeRepository {
  getCreatedNotesPage(
    userId: number | bigint,
    page: number,
    limit: number,
    queryClient?: PrismaQueryClientLike
  ): Promise<{
    rows: MyNoteRow[]
    total: number
  }>
  getFavoriteNotesPage(
    userId: number | bigint,
    page: number,
    limit: number,
    queryClient?: PrismaQueryClientLike
  ): Promise<{
    rows: MyFavoriteRow[]
    total: number
  }>
  transaction<T>(
    callback: (transactionClient: PrismaTransactionalClientLike) => Promise<T>
  ): Promise<T>
}

export type MyNotesServiceResult =
  | {
      status: 'success'
      response: MyNotesResponseDto
    }
  | {
      status: 'unauthorized'
      error: MeErrorDto
    }

export type MyFavoritesServiceResult =
  | {
      status: 'success'
      response: MyFavoritesResponseDto
    }
  | {
      status: 'unauthorized'
      error: MeErrorDto
    }

export interface MeService {
  getMyNotes(
    query: MyNotesQueryDto | undefined,
    session: AuthenticatedSessionDto | null
  ): Promise<MyNotesServiceResult>
  getMyFavorites(
    query: MyNotesQueryDto | undefined,
    session: AuthenticatedSessionDto | null
  ): Promise<MyFavoritesServiceResult>
}

function createUnauthorizedError(view: 'notes' | 'favorites'): MeErrorDto {
  return {
    code: 'ME_AUTH_REQUIRED',
    status: 'unauthorized',
    message:
      view === 'favorites'
        ? '查看我的收藏前请先完成登录。'
        : '查看我的创建前请先完成登录。'
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback
  }

  return Math.floor(parsedValue)
}

function normalizeMyNotesQuery(query: MyNotesQueryDto | undefined) {
  const page = Math.min(normalizePositiveInteger(query?.page, DEFAULT_PAGE), MAX_PAGE)
  const limit = Math.min(normalizePositiveInteger(query?.limit, DEFAULT_LIMIT), MAX_LIMIT)

  return {
    page,
    limit,
    offset: (page - 1) * limit
  }
}

function resolveUpdatedAtIsoString(updatedAt: Date | string) {
  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt)

  return date.toISOString()
}

function resolvePreview(content: string) {
  const normalizedContent = content.replace(/\s+/gu, ' ').trim()

  if (normalizedContent === '') {
    return '空白便签'
  }

  return normalizedContent.slice(0, 80)
}

export function createPrismaMeRepository(
  options: PrismaMeRepositoryOptions = {}
): MeRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  async function resolveCreatedNotesPage(
    prisma: PrismaQueryClientLike | PrismaTransactionalClientLike,
    userId: number | bigint,
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit
    const normalizedUserId = toBigInt(userId).toString()
    const [rows, matchedRows] = await Promise.all([
      prisma.$queryRawUnsafe<MyNoteRow[]>(
        createdNotesLookupSql,
        normalizedUserId,
        limit,
        offset
      ),
      prisma.$queryRawUnsafe<CountRow[]>(
        createdNotesCountSql,
        normalizedUserId
      )
    ])

    return {
      rows,
      total: Number(matchedRows[0]?.total ?? 0)
    }
  }

  async function resolveFavoriteNotesPage(
    prisma: PrismaQueryClientLike | PrismaTransactionalClientLike,
    userId: number | bigint,
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit
    const normalizedUserId = toBigInt(userId).toString()
    const [rows, matchedRows] = await Promise.all([
      prisma.$queryRawUnsafe<MyFavoriteRow[]>(
        favoriteNotesLookupSql,
        normalizedUserId,
        limit,
        offset
      ),
      prisma.$queryRawUnsafe<CountRow[]>(
        favoriteNotesCountSql,
        normalizedUserId
      )
    ])

    return {
      rows,
      total: Number(matchedRows[0]?.total ?? 0)
    }
  }

  return {
    async getCreatedNotesPage(userId, page, limit, queryClient) {
      if (queryClient) {
        return resolveCreatedNotesPage(queryClient, userId, page, limit)
      }

      const prisma = await resolvePrismaClient()

      return prisma.$transaction((transactionClient) =>
        resolveCreatedNotesPage(transactionClient, userId, page, limit)
      )
    },
    async getFavoriteNotesPage(userId, page, limit, queryClient) {
      if (queryClient) {
        return resolveFavoriteNotesPage(queryClient, userId, page, limit)
      }

      const prisma = await resolvePrismaClient()

      return prisma.$transaction((transactionClient) =>
        resolveFavoriteNotesPage(transactionClient, userId, page, limit)
      )
    },
    async transaction(callback) {
      const prisma = await resolvePrismaClient()

      return prisma.$transaction(callback)
    }
  }
}

export function createMeService(
  repository: MeRepository = createPrismaMeRepository(),
  userRepository: UserRepository = createPrismaUserRepository()
): MeService {
  return {
    async getMyNotes(query, session) {
      const ssoId = normalizeAuthSessionSsoId(session)
      const normalizedQuery = normalizeMyNotesQuery(query)

      if (!ssoId) {
        return {
          status: 'unauthorized',
          error: createUnauthorizedError('notes')
        }
      }

      const { rows, total } = await repository.transaction(async (transactionClient) => {
        const actor = await userRepository.ensureBySsoId(ssoId, transactionClient)

        return repository.getCreatedNotesPage(
          actor.id,
          normalizedQuery.page,
          normalizedQuery.limit,
          transactionClient
        )
      })

      return {
        status: 'success',
        response: {
          items: rows.map((row) => ({
            sid: row.sid,
            preview: resolvePreview(row.content),
            updatedAt: resolveUpdatedAtIsoString(row.updatedAt)
          })),
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          hasMore: normalizedQuery.offset + rows.length < total
        }
      }
    },
    async getMyFavorites(query, session) {
      const ssoId = normalizeAuthSessionSsoId(session)
      const normalizedQuery = normalizeMyNotesQuery(query)

      if (!ssoId) {
        return {
          status: 'unauthorized',
          error: createUnauthorizedError('favorites')
        }
      }

      const { rows, total } = await repository.transaction(async (transactionClient) => {
        const actor = await userRepository.ensureBySsoId(ssoId, transactionClient)

        return repository.getFavoriteNotesPage(
          actor.id,
          normalizedQuery.page,
          normalizedQuery.limit,
          transactionClient
        )
      })

      return {
        status: 'success',
        response: {
          items: rows.map((row) => ({
            sid: row.sid,
            preview: resolvePreview(row.content),
            updatedAt: resolveUpdatedAtIsoString(row.updatedAt),
            favoritedAt: resolveUpdatedAtIsoString(row.favoritedAt)
          })),
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          hasMore: normalizedQuery.offset + rows.length < total
        }
      }
    }
  }
}
