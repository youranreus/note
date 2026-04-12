import type {
  AuthenticatedSessionDto,
  NoteEditAccess,
  NoteReadErrorDto,
  OnlineNoteDetailDto
} from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaQueryClientLike
} from './prisma-client.js'
import { createNoteEditKeyService, type NoteEditKeyService } from './note-edit-key-service.js'
import { resolveNoteAuthorizationContext } from './note-authorization-service.js'
import {
  createPrismaUserRepository,
  type UserRepository
} from './user-service.js'

interface PrismaNoteReadRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

export interface NoteRecordRow {
  id: number | bigint
  sid: string
  content: string
  authorId: number | bigint | null
  keyHash: string | null
  deletedAt: Date | null
}

export interface FavoriteSummaryRepository {
  isFavoritedByUser(
    noteId: number | bigint,
    userId: number | bigint,
    queryClient?: PrismaQueryClientLike
  ): Promise<boolean>
}

export interface NoteReadRepository {
  findBySid(sid: string): Promise<NoteRecordRow[]>
}

export type NoteReadServiceResult =
  | {
      status: 'available'
      note: OnlineNoteDetailDto
    }
  | {
      status: 'not-found' | 'deleted'
      error: NoteReadErrorDto
    }

export interface NoteReadService {
  getBySid(
    sid: string,
    session: AuthenticatedSessionDto | null,
    editKey?: string | null
  ): Promise<NoteReadServiceResult>
}

const noteLookupSql =
  'SELECT id, sid, content, author_id AS authorId, key_hash AS keyHash, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2'
const favoriteLookupSql =
  'SELECT 1 AS matched FROM note_favorites WHERE note_id = ? AND user_id = ? LIMIT 1'

function createNoteReadError(
  sid: string,
  code: NoteReadErrorDto['code'],
  status: NoteReadErrorDto['status'],
  message: string
): NoteReadErrorDto {
  return {
    sid,
    code,
    status,
    message
  }
}

function createAvailableNote(
  sid: string,
  content: string,
  editAccess: NoteEditAccess
): OnlineNoteDetailDto {
  return {
    sid,
    content,
    status: 'available',
    editAccess,
    favoriteState: 'not-favorited'
  }
}

export class NoteSidConflictError extends Error {
  constructor(readonly sid: string) {
    super(`Multiple note records matched sid "${sid}".`)
    this.name = 'NoteSidConflictError'
  }
}

export function createPrismaNoteReadRepository(
  options: PrismaNoteReadRepositoryOptions = {}
): NoteReadRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  return {
    async findBySid(sid) {
      const prisma = await resolvePrismaClient()

      return prisma.$queryRawUnsafe<NoteRecordRow[]>(noteLookupSql, sid)
    }
  }
}

export function createPrismaFavoriteSummaryRepository(
  options: PrismaNoteReadRepositoryOptions = {}
): FavoriteSummaryRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  return {
    async isFavoritedByUser(noteId, userId, queryClient) {
      const prisma = queryClient ?? (await resolvePrismaClient())
      const matchedRows = await prisma.$queryRawUnsafe<Array<{ matched: number }>>(
        favoriteLookupSql,
        typeof noteId === 'bigint' ? noteId.toString() : noteId,
        typeof userId === 'bigint' ? userId.toString() : userId
      )

      return matchedRows.length > 0
    }
  }
}

export function createNoteReadService(
  repository: NoteReadRepository = createPrismaNoteReadRepository(),
  userRepository: UserRepository = createPrismaUserRepository(),
  editKeyService: NoteEditKeyService = createNoteEditKeyService(),
  favoriteSummaryRepository: FavoriteSummaryRepository = createPrismaFavoriteSummaryRepository()
): NoteReadService {
  return {
    async getBySid(sid, session, editKey) {
      const matchedNotes = await repository.findBySid(sid)

      if (matchedNotes.length > 1) {
        throw new NoteSidConflictError(sid)
      }

      const matchedNote = matchedNotes[0]

      if (!matchedNote) {
        return {
          status: 'not-found',
          error: createNoteReadError(
            sid,
            'NOTE_NOT_FOUND',
            'not-found',
            '未找到与当前 sid 对应的在线便签。'
          )
        }
      }

      if (matchedNote.deletedAt) {
        return {
          status: 'deleted',
          error: createNoteReadError(
            sid,
            'NOTE_DELETED',
            'deleted',
            '该在线便签已删除，当前链接不可继续读取。'
          )
        }
      }

      const authorizationContext = await resolveNoteAuthorizationContext(
        {
          authorId: matchedNote.authorId,
          keyHash: matchedNote.keyHash
        },
        session,
        userRepository
      )

      let editAccess: NoteEditAccess = authorizationContext.editAccess
      const normalizedEditKey = editKey?.trim()

      if (
        authorizationContext.editAccess === 'key-required' &&
        normalizedEditKey &&
        matchedNote.keyHash
      ) {
        const isValidEditKey = await editKeyService.verifyKey(normalizedEditKey, matchedNote.keyHash)

        if (isValidEditKey) {
          editAccess = 'key-editable'
        }
      }

      let favoriteState: OnlineNoteDetailDto['favoriteState'] = 'not-favorited'

      if (authorizationContext.actor === 'owner') {
        favoriteState = 'self-owned'
      } else if (authorizationContext.actorUserId != null) {
        const isFavorited = await favoriteSummaryRepository.isFavoritedByUser(
          matchedNote.id,
          authorizationContext.actorUserId
        )

        favoriteState = isFavorited ? 'favorited' : 'not-favorited'
      }

      return {
        status: 'available',
        note: {
          ...createAvailableNote(matchedNote.sid, matchedNote.content, editAccess),
          favoriteState
        }
      }
    }
  }
}
