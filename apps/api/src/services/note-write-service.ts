import type {
  AuthenticatedSessionDto,
  NoteEditAccess,
  NoteWriteErrorDto,
  OnlineNoteSaveRequestDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaTransactionalClientLike
} from './prisma-client.js'
import { NoteSidConflictError } from './note-read-service.js'
import {
  createPrismaUserRepository,
  normalizeAuthSessionSsoId,
  toBigInt,
  type UserRepository
} from './user-service.js'

interface PrismaNoteWriteRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

interface LockRow {
  acquired: number | bigint | null
}

interface NoteWriteRecordRow {
  id: number | bigint
  sid: string
  content: string
  authorId: number | bigint | null
  deletedAt: Date | null
}

export type NoteWriteServiceResult =
  | {
      status: 'created' | 'updated'
      note: OnlineNoteSaveResponseDto
    }
  | {
      status: 'deleted' | 'forbidden'
      error: NoteWriteErrorDto
    }

export interface NoteWriteRepository {
  saveBySid(
    sid: string,
    input: OnlineNoteSaveRequestDto,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteWriteServiceResult>
}

export interface NoteWriteService {
  saveBySid(
    sid: string,
    input: OnlineNoteSaveRequestDto,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteWriteServiceResult>
}

const noteWriteLookupSql =
  'SELECT id, sid, content, author_id AS authorId, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2 FOR UPDATE'
const noteInsertAnonymousSql =
  'INSERT INTO notes (sid, content, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteInsertOwnedSql =
  'INSERT INTO notes (sid, content, author_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteUpdateSql =
  'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? LIMIT 1'
const acquireSidWriteLockSql = 'SELECT GET_LOCK(?, 5) AS acquired'
const releaseSidWriteLockSql = 'SELECT RELEASE_LOCK(?)'

function createNoteWriteError(
  sid: string,
  code: NoteWriteErrorDto['code'],
  status: NoteWriteErrorDto['status'],
  message: string
): NoteWriteErrorDto {
  return {
    sid,
    code,
    status,
    message
  }
}

function createForbiddenError(
  sid: string,
  message = '当前账户不能修改这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
): NoteWriteErrorDto {
  return createNoteWriteError(sid, 'NOTE_FORBIDDEN', 'forbidden', message)
}

function createSuccessNote(
  sid: string,
  content: string,
  saveResult: OnlineNoteSaveResponseDto['saveResult'],
  editAccess: NoteEditAccess
): OnlineNoteSaveResponseDto {
  return {
    sid,
    content,
    status: 'available',
    editAccess,
    saveResult
  }
}

function resolveLockName(sid: string) {
  return `notes:write:${sid}`
}

async function acquireWriteLock(
  transactionClient: PrismaTransactionalClientLike,
  sid: string
) {
  const lockName = resolveLockName(sid)
  const lockRows = await transactionClient.$queryRawUnsafe<LockRow[]>(acquireSidWriteLockSql, lockName)
  const lockAcquired = Number(lockRows[0]?.acquired ?? 0)

  if (lockAcquired !== 1) {
    throw new Error(`Unable to acquire note write lock for sid "${sid}".`)
  }

  return lockName
}

export function createPrismaNoteWriteRepository(
  options: PrismaNoteWriteRepositoryOptions = {}
): NoteWriteRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient
  const userRepository = createPrismaUserRepository(options)

  return {
    async saveBySid(sid, input, session) {
      const prisma = await resolvePrismaClient()

      return prisma.$transaction(async (transactionClient) => {
        const lockName = await acquireWriteLock(transactionClient, sid)

        try {
          const matchedNotes = await transactionClient.$queryRawUnsafe<NoteWriteRecordRow[]>(
            noteWriteLookupSql,
            sid
          )

          if (matchedNotes.length > 1) {
            throw new NoteSidConflictError(sid)
          }

          const matchedNote = matchedNotes[0]
          const sessionSsoId = normalizeAuthSessionSsoId(session)

          if (!matchedNote) {
            if (!session) {
              await transactionClient.$executeRawUnsafe(noteInsertAnonymousSql, sid, input.content)

              return {
                status: 'created',
                note: createSuccessNote(sid, input.content, 'created', 'anonymous-editable')
              }
            }

            if (!sessionSsoId) {
              return {
                status: 'forbidden',
                error: createForbiddenError(
                  sid,
                  '当前登录身份无法映射为有效作者，请重新登录后再试。'
                )
              }
            }

            const matchedUser = await userRepository.ensureBySsoId(sessionSsoId, transactionClient)

            await transactionClient.$executeRawUnsafe(
              noteInsertOwnedSql,
              sid,
              input.content,
              toBigInt(matchedUser.id).toString()
            )

            return {
              status: 'created',
              note: createSuccessNote(sid, input.content, 'created', 'owner-editable')
            }
          }

          if (matchedNote.deletedAt) {
            return {
              status: 'deleted',
              error: createNoteWriteError(
                sid,
                'NOTE_DELETED',
                'deleted',
                '该在线便签已删除，当前链接不可继续写入。'
              )
            }
          }

          if (matchedNote.authorId != null) {
            if (!sessionSsoId) {
              return {
                status: 'forbidden',
                error: createForbiddenError(sid)
              }
            }

            const matchedUser = await userRepository.findBySsoId(sessionSsoId, transactionClient)

            if (!matchedUser || toBigInt(matchedUser.id) !== toBigInt(matchedNote.authorId)) {
              return {
                status: 'forbidden',
                error: createForbiddenError(sid)
              }
            }

            await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

            return {
              status: 'updated',
              note: createSuccessNote(sid, input.content, 'updated', 'owner-editable')
            }
          }

          await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

          return {
            status: 'updated',
            note: createSuccessNote(sid, input.content, 'updated', 'anonymous-editable')
          }
        } finally {
          await transactionClient
            .$queryRawUnsafe(releaseSidWriteLockSql, lockName)
            .catch(() => undefined)
        }
      })
    }
  }
}

export function createNoteWriteService(
  repository: NoteWriteRepository = createPrismaNoteWriteRepository()
): NoteWriteService {
  return {
    saveBySid(sid, input, session) {
      return repository.saveBySid(sid, input, session)
    }
  }
}
