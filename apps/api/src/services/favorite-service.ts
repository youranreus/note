import type {
  AuthenticatedSessionDto,
  FavoriteErrorDto,
  FavoriteResponseDto
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

interface PrismaFavoriteRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

export interface FavoriteNoteRecordRow {
  id: number | bigint
  sid: string
  authorId: number | bigint | null
  deletedAt: Date | null
}

export interface FavoriteRepository {
  createFavorite(noteId: number | bigint, userId: number | bigint, transactionClient: PrismaTransactionalClientLike): Promise<void>
  findNoteBySid(sid: string, queryClient?: PrismaQueryClientLike): Promise<FavoriteNoteRecordRow[]>
  transaction<T>(callback: (transactionClient: PrismaTransactionalClientLike) => Promise<T>): Promise<T>
}

export type FavoriteServiceResult =
  | {
      status: 'favorited'
      favorite: FavoriteResponseDto
    }
  | {
      status: 'unauthorized' | 'not-found' | 'deleted' | 'forbidden' | 'error'
      error: FavoriteErrorDto
    }

export interface FavoriteService {
  favoriteBySid(
    sid: string,
    session: AuthenticatedSessionDto | null
  ): Promise<FavoriteServiceResult>
}

const noteLookupSql =
  'SELECT id, sid, author_id AS authorId, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2'
const favoriteInsertSql =
  'INSERT IGNORE INTO note_favorites (note_id, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP(3))'

function createFavoriteError(
  sid: string,
  code: FavoriteErrorDto['code'],
  status: FavoriteErrorDto['status'],
  message: string
): FavoriteErrorDto {
  return {
    sid,
    code,
    status,
    message
  }
}

export function createPrismaFavoriteRepository(
  options: PrismaFavoriteRepositoryOptions = {}
): FavoriteRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  return {
    async createFavorite(noteId, userId, transactionClient) {
      await transactionClient.$executeRawUnsafe(
        favoriteInsertSql,
        toBigInt(noteId).toString(),
        toBigInt(userId).toString()
      )
    },
    async findNoteBySid(sid, queryClient) {
      const prisma = queryClient ?? (await resolvePrismaClient())

      return prisma.$queryRawUnsafe<FavoriteNoteRecordRow[]>(noteLookupSql, sid)
    },
    async transaction(callback) {
      const prisma = await resolvePrismaClient()

      return prisma.$transaction(callback)
    }
  }
}

export function createFavoriteService(
  repository: FavoriteRepository = createPrismaFavoriteRepository(),
  userRepository: UserRepository = createPrismaUserRepository()
): FavoriteService {
  return {
    async favoriteBySid(sid, session) {
      const ssoId = normalizeAuthSessionSsoId(session)

      if (!ssoId) {
        return {
          status: 'unauthorized',
          error: createFavoriteError(
            sid,
            'FAVORITE_AUTH_REQUIRED',
            'unauthorized',
            '收藏前请先完成登录。'
          )
        }
      }

      return repository.transaction(async (transactionClient) => {
        const actor = await userRepository.ensureBySsoId(ssoId, transactionClient)
        const matchedNotes = await repository.findNoteBySid(sid, transactionClient)

        if (matchedNotes.length > 1) {
          return {
            status: 'error',
            error: createFavoriteError(
              sid,
              'FAVORITE_NOTE_SID_CONFLICT',
              'error',
              '当前 sid 命中了多条记录，无法按唯一对象语义执行收藏。'
            )
          }
        }

        const matchedNote = matchedNotes[0]

        if (!matchedNote) {
          return {
            status: 'not-found',
            error: createFavoriteError(
              sid,
              'FAVORITE_NOTE_NOT_FOUND',
              'not-found',
              '未找到可收藏的在线便签。'
            )
          }
        }

        if (matchedNote.deletedAt) {
          return {
            status: 'deleted',
            error: createFavoriteError(
              sid,
              'FAVORITE_NOTE_DELETED',
              'deleted',
              '这条在线便签已删除，当前无法加入收藏。'
            )
          }
        }

        if (matchedNote.authorId != null && toBigInt(matchedNote.authorId) === toBigInt(actor.id)) {
          return {
            status: 'forbidden',
            error: createFavoriteError(
              sid,
              'FAVORITE_SELF_OWNED_NOT_ALLOWED',
              'forbidden',
              '自己创建的便签不需要再收藏。'
            )
          }
        }

        await repository.createFavorite(matchedNote.id, actor.id, transactionClient)

        return {
          status: 'favorited',
          favorite: {
            sid: matchedNote.sid,
            favoriteState: 'favorited'
          }
        }
      })
    }
  }
}
