import type { NoteReadErrorDto, OnlineNoteDetailDto } from '@note/shared-types'

interface PrismaClientLike {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
}

interface PrismaModuleLike {
  PrismaClient?: new () => PrismaClientLike
  default?: {
    PrismaClient?: new () => PrismaClientLike
  }
}

export interface NoteRecordRow {
  sid: string
  content: string
  deletedAt: Date | null
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
  getBySid(sid: string): Promise<NoteReadServiceResult>
}

const noteLookupSql =
  'SELECT sid, content, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2'

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

export class NoteSidConflictError extends Error {
  constructor(readonly sid: string) {
    super(`Multiple note records matched sid "${sid}".`)
    this.name = 'NoteSidConflictError'
  }
}

export function createPrismaNoteReadRepository(): NoteReadRepository {
  return {
    async findBySid(sid) {
      const prisma = await getPrismaClient()

      return prisma.$queryRawUnsafe<NoteRecordRow[]>(noteLookupSql, sid)
    }
  }
}

export function createNoteReadService(
  repository: NoteReadRepository = createPrismaNoteReadRepository()
): NoteReadService {
  return {
    async getBySid(sid) {
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

      return {
        status: 'available',
        note: {
          sid: matchedNote.sid,
          content: matchedNote.content,
          status: 'available'
        }
      }
    }
  }
}
