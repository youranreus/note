import type {
  AuthenticatedSessionDto,
  MeErrorDto,
  MyNotesQueryDto,
  MyNotesResponseDto
} from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaQueryClientLike
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

interface PrismaMeRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

interface MyNoteRow {
  id: number | bigint
  sid: string
  content: string
  updatedAt: Date | string
}

interface CountRow {
  total: number | bigint
}

export interface MeRepository {
  countCreatedNotes(userId: number | bigint, queryClient?: PrismaQueryClientLike): Promise<number>
  listCreatedNotes(
    userId: number | bigint,
    page: number,
    limit: number,
    queryClient?: PrismaQueryClientLike
  ): Promise<MyNoteRow[]>
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

export interface MeService {
  getMyNotes(
    query: MyNotesQueryDto | undefined,
    session: AuthenticatedSessionDto | null
  ): Promise<MyNotesServiceResult>
}

function createUnauthorizedError(): MeErrorDto {
  return {
    code: 'ME_AUTH_REQUIRED',
    status: 'unauthorized',
    message: '查看我的创建前请先完成登录。'
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
  const page = normalizePositiveInteger(query?.page, DEFAULT_PAGE)
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

  return {
    async countCreatedNotes(userId, queryClient) {
      const prisma = queryClient ?? (await resolvePrismaClient())
      const matchedRows = await prisma.$queryRawUnsafe<CountRow[]>(
        createdNotesCountSql,
        toBigInt(userId).toString()
      )

      return Number(matchedRows[0]?.total ?? 0)
    },
    async listCreatedNotes(userId, page, limit, queryClient) {
      const prisma = queryClient ?? (await resolvePrismaClient())
      const offset = (page - 1) * limit

      return prisma.$queryRawUnsafe<MyNoteRow[]>(
        createdNotesLookupSql,
        toBigInt(userId).toString(),
        limit,
        offset
      )
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

      if (!ssoId) {
        return {
          status: 'unauthorized',
          error: createUnauthorizedError()
        }
      }

      const actor = await userRepository.findBySsoId(ssoId)
      const normalizedQuery = normalizeMyNotesQuery(query)

      if (!actor) {
        return {
          status: 'success',
          response: {
            items: [],
            page: normalizedQuery.page,
            limit: normalizedQuery.limit,
            total: 0,
            hasMore: false
          }
        }
      }

      const [rows, total] = await Promise.all([
        repository.listCreatedNotes(actor.id, normalizedQuery.page, normalizedQuery.limit),
        repository.countCreatedNotes(actor.id)
      ])

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
    }
  }
}
