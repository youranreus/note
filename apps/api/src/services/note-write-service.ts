import type {
  NoteWriteErrorDto,
  OnlineNoteSaveRequestDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import { NoteSidConflictError } from './note-read-service.js'

interface PrismaTransactionalClientLike {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>
}

interface PrismaClientLike extends PrismaTransactionalClientLike {
  $transaction<T>(callback: (transactionClient: PrismaTransactionalClientLike) => Promise<T>): Promise<T>
}

interface PrismaModuleLike {
  PrismaClient?: new () => PrismaClientLike
  default?: {
    PrismaClient?: new () => PrismaClientLike
  }
}

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
  deletedAt: Date | null
}

export type NoteWriteServiceResult =
  | {
      status: 'created' | 'updated'
      note: OnlineNoteSaveResponseDto
    }
  | {
      status: 'deleted'
      error: NoteWriteErrorDto
    }

export interface NoteWriteRepository {
  saveBySid(sid: string, input: OnlineNoteSaveRequestDto): Promise<NoteWriteServiceResult>
}

export interface NoteWriteService {
  saveBySid(sid: string, input: OnlineNoteSaveRequestDto): Promise<NoteWriteServiceResult>
}

const noteWriteLookupSql =
  'SELECT id, sid, content, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2 FOR UPDATE'
const noteInsertSql = 'INSERT INTO notes (sid, content) VALUES (?, ?)'
const noteUpdateSql = 'UPDATE notes SET content = ? WHERE id = ? LIMIT 1'
const acquireSidWriteLockSql = 'SELECT GET_LOCK(?, 5) AS acquired'
const releaseSidWriteLockSql = 'SELECT RELEASE_LOCK(?)'

let prismaClientPromise: Promise<PrismaClientLike> | undefined

async function getPrismaClient() {
  if (!prismaClientPromise) {
    prismaClientPromise = import('@prisma/client').then((module) => {
      const prismaModule = module as PrismaModuleLike
      const PrismaClientConstructor =
        prismaModule.PrismaClient ?? prismaModule.default?.PrismaClient

      if (!PrismaClientConstructor) {
        throw new Error(
          'PrismaClient is unavailable. Run pnpm --filter @note/api db:init to generate the client.'
        )
      }

      return new PrismaClientConstructor()
    })
  }

  return prismaClientPromise
}

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

function createSuccessNote(
  sid: string,
  content: string,
  saveResult: OnlineNoteSaveResponseDto['saveResult']
): OnlineNoteSaveResponseDto {
  return {
    sid,
    content,
    status: 'available',
    saveResult
  }
}

function resolveLockName(sid: string) {
  return `notes:write:${sid}`
}

export function createPrismaNoteWriteRepository(
  options: PrismaNoteWriteRepositoryOptions = {}
): NoteWriteRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  return {
    async saveBySid(sid, input) {
      const prisma = await resolvePrismaClient()

      return prisma.$transaction(async (transactionClient) => {
        const lockName = resolveLockName(sid)
        const lockRows = await transactionClient.$queryRawUnsafe<LockRow[]>(
          acquireSidWriteLockSql,
          lockName
        )
        const lockAcquired = Number(lockRows[0]?.acquired ?? 0)

        if (lockAcquired !== 1) {
          throw new Error(`Unable to acquire note write lock for sid "${sid}".`)
        }

        try {
          const matchedNotes = await transactionClient.$queryRawUnsafe<NoteWriteRecordRow[]>(
            noteWriteLookupSql,
            sid
          )

          if (matchedNotes.length > 1) {
            throw new NoteSidConflictError(sid)
          }

          const matchedNote = matchedNotes[0]

          if (!matchedNote) {
            await transactionClient.$executeRawUnsafe(noteInsertSql, sid, input.content)

            return {
              status: 'created',
              note: createSuccessNote(sid, input.content, 'created')
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

          await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

          return {
            status: 'updated',
            note: createSuccessNote(sid, input.content, 'updated')
          }
        } finally {
          await transactionClient.$queryRawUnsafe(releaseSidWriteLockSql, lockName).catch(() => undefined)
        }
      })
    }
  }
}

export function createNoteWriteService(
  repository: NoteWriteRepository = createPrismaNoteWriteRepository()
): NoteWriteService {
  return {
    saveBySid(sid, input) {
      return repository.saveBySid(sid, input)
    }
  }
}
