import type {
  AuthenticatedSessionDto,
  NoteEditAccess,
  NoteDeleteErrorDto,
  NoteWriteErrorDto,
  OnlineNoteDeleteResponseDto,
  OnlineNoteEditKeyAction,
  OnlineNoteFavoriteState,
  OnlineNoteSaveRequestDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaQueryClientLike,
  type PrismaTransactionalClientLike
} from './prisma-client.js'
import { resolveNoteAuthorizationContext } from './note-authorization-service.js'
import {
  createPrismaFavoriteSummaryRepository,
  type FavoriteSummaryRepository,
  NoteSidConflictError
} from './note-read-service.js'
import { createNoteEditKeyService, type NoteEditKeyService } from './note-edit-key-service.js'
import {
  createPrismaUserRepository,
  normalizeAuthSessionSsoId,
  toBigInt,
  type UserRepository
} from './user-service.js'

interface PrismaNoteWriteRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
  editKeyService?: NoteEditKeyService
  favoriteSummaryRepository?: FavoriteSummaryRepository
}

interface LockRow {
  acquired: number | bigint | null
}

interface NoteWriteRecordRow {
  id: number | bigint
  sid: string
  content: string
  authorId: number | bigint | null
  keyHash: string | null
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

export type NoteDeleteServiceResult =
  | {
      status: 'deleted'
      note: OnlineNoteDeleteResponseDto
    }
  | {
      status: 'not-found' | 'already-deleted' | 'forbidden' | 'conflict'
      error: NoteDeleteErrorDto
    }

export interface NoteWriteRepository {
  saveBySid(
    sid: string,
    input: OnlineNoteSaveRequestDto,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteWriteServiceResult>
  deleteBySid(
    sid: string,
    editKey: string | null,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteDeleteServiceResult>
}

export interface NoteWriteService {
  saveBySid(
    sid: string,
    input: OnlineNoteSaveRequestDto,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteWriteServiceResult>
  deleteBySid(
    sid: string,
    editKey: string | null,
    session: AuthenticatedSessionDto | null
  ): Promise<NoteDeleteServiceResult>
}

const noteWriteLookupSql =
  'SELECT id, sid, content, author_id AS authorId, key_hash AS keyHash, deleted_at AS deletedAt FROM notes WHERE sid = ? ORDER BY id DESC LIMIT 2 FOR UPDATE'
const noteInsertAnonymousSql =
  'INSERT INTO notes (sid, content, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteInsertAnonymousWithKeySql =
  'INSERT INTO notes (sid, content, key_hash, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteInsertOwnedSql =
  'INSERT INTO notes (sid, content, author_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteInsertOwnedWithKeySql =
  'INSERT INTO notes (sid, content, author_id, key_hash, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'
const noteUpdateSql =
  'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? LIMIT 1'
const noteUpdateWithKeySql =
  'UPDATE notes SET content = ?, key_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? LIMIT 1'
const noteDeleteSql =
  'UPDATE notes SET deleted_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? LIMIT 1'
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

function createNoteDeleteError(
  sid: string,
  code: NoteDeleteErrorDto['code'],
  status: NoteDeleteErrorDto['status'],
  message: string
): NoteDeleteErrorDto {
  return {
    sid,
    code,
    status,
    message
  }
}

function createDeleteForbiddenError(
  sid: string,
  message = '当前账户不能删除这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_FORBIDDEN', 'forbidden', message)
}

function createDeleteEditKeyRequiredError(
  sid: string,
  message = '当前对象需要输入编辑密钥后才能删除。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_EDIT_KEY_REQUIRED', 'forbidden', message)
}

function createDeleteEditKeyInvalidError(
  sid: string,
  message = '当前编辑密钥不正确，请确认后重试。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_EDIT_KEY_INVALID', 'forbidden', message)
}

function createDeleteNotFoundError(
  sid: string,
  message = '未找到与当前 sid 对应的在线便签。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_NOT_FOUND', 'not-found', message)
}

function createAlreadyDeletedError(
  sid: string,
  message = '该在线便签已删除，当前链接不可继续删除。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_DELETED', 'deleted', message)
}

function createDeleteConflictError(
  sid: string,
  message = '当前 sid 命中了多条记录，无法按唯一对象语义删除结果。'
): NoteDeleteErrorDto {
  return createNoteDeleteError(sid, 'NOTE_SID_CONFLICT', 'error', message)
}

function createDeleteSuccessNote(
  sid: string,
  message = '该在线便签已删除，当前链接不可恢复。'
): OnlineNoteDeleteResponseDto {
  return {
    sid,
    status: 'deleted',
    message
  }
}

function createEditKeyRequiredError(
  sid: string,
  message = '当前对象需要输入编辑密钥后才能保存更新。'
): NoteWriteErrorDto {
  return createNoteWriteError(sid, 'NOTE_EDIT_KEY_REQUIRED', 'forbidden', message)
}

function createEditKeyInvalidError(
  sid: string,
  message = '当前编辑密钥不正确，请确认后重试。'
): NoteWriteErrorDto {
  return createNoteWriteError(sid, 'NOTE_EDIT_KEY_INVALID', 'forbidden', message)
}

function createInvalidEditKeyIntentError(
  sid: string,
  message = '当前请求中的编辑密钥用途无效，请刷新页面后重试。'
): NoteWriteErrorDto {
  return createNoteWriteError(sid, 'NOTE_EDIT_KEY_ACTION_INVALID', 'forbidden', message)
}

function createSuccessNote(
  sid: string,
  content: string,
  saveResult: OnlineNoteSaveResponseDto['saveResult'],
  editAccess: NoteEditAccess,
  favoriteState: OnlineNoteFavoriteState = editAccess === 'owner-editable'
    ? 'self-owned'
    : 'not-favorited'
): OnlineNoteSaveResponseDto {
  return {
    sid,
    content,
    status: 'available',
    editAccess,
    favoriteState,
    saveResult
  }
}

function resolveLockName(sid: string) {
  return `notes:write:${sid}`
}

function normalizeEditKey(editKey: string | undefined) {
  if (typeof editKey !== 'string') {
    return null
  }

  const normalized = editKey.trim()

  return normalized === '' ? null : normalized
}

function resolveEditKeyAction(input: OnlineNoteSaveRequestDto): OnlineNoteEditKeyAction {
  const action = input.editKeyAction

  if (action === 'set' || action === 'use' || action === 'none' || action == null) {
    return action ?? 'none'
  }

  return 'none'
}

function resolveEditKeyIntent(sid: string, input: OnlineNoteSaveRequestDto) {
  const normalizedEditKey = normalizeEditKey(input.editKey)
  const requestedEditKeyAction = input.editKeyAction
  const editKeyAction = resolveEditKeyAction(input)

  if (
    requestedEditKeyAction != null &&
    requestedEditKeyAction !== 'none' &&
    requestedEditKeyAction !== 'set' &&
    requestedEditKeyAction !== 'use'
  ) {
    return {
      normalizedEditKey,
      shouldSetEditKey: false,
      shouldUseEditKey: false,
      error: createInvalidEditKeyIntentError(
        sid,
        '当前请求中的编辑密钥操作无效，请改为使用 set 或 use 后重试。'
      )
    }
  }

  if (editKeyAction === 'none') {
    if (normalizedEditKey != null) {
      return {
        normalizedEditKey,
        shouldSetEditKey: false,
        shouldUseEditKey: false,
        error: createInvalidEditKeyIntentError(
          sid,
          '当前请求提供了编辑密钥，但没有声明要设置还是使用该密钥。'
        )
      }
    }

    return {
      normalizedEditKey,
      shouldSetEditKey: false,
      shouldUseEditKey: false,
      error: null
    }
  }

  if (normalizedEditKey == null) {
    return {
      normalizedEditKey,
      shouldSetEditKey: false,
      shouldUseEditKey: false,
      error: createEditKeyRequiredError(
        sid,
        editKeyAction === 'set'
          ? '设置编辑密钥时必须提供非空密钥。'
          : '使用编辑密钥保存时必须先输入密钥。'
      )
    }
  }

  return {
    normalizedEditKey,
    shouldSetEditKey: editKeyAction === 'set',
    shouldUseEditKey: editKeyAction === 'use',
    error: null
  }
}

function requireEditKey(normalizedEditKey: string | null) {
  if (normalizedEditKey == null) {
    throw new Error('Edit key intent resolved without a usable edit key.')
  }

  return normalizedEditKey
}

function requireStoredKeyHash(keyHash: string | null) {
  if (keyHash == null) {
    throw new Error('Authorization resolved with edit-key protection but note record has no key hash.')
  }

  return keyHash
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

function isQueryClient(
  value: PrismaTransactionalClientLike | PrismaQueryClientLike
): value is PrismaQueryClientLike {
  return '$queryRawUnsafe' in value
}

export function createPrismaNoteWriteRepository(
  options: PrismaNoteWriteRepositoryOptions = {}
): NoteWriteRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient
  const userRepository = createPrismaUserRepository(options)
  const editKeyService = options.editKeyService ?? createNoteEditKeyService()
  const favoriteSummaryRepository =
    options.favoriteSummaryRepository ?? createPrismaFavoriteSummaryRepository(options)

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
          const editKeyIntent = resolveEditKeyIntent(sid, input)

          if (editKeyIntent.error) {
            return {
              status: 'forbidden',
              error: editKeyIntent.error
            }
          }

          const { normalizedEditKey, shouldSetEditKey, shouldUseEditKey } = editKeyIntent

          if (!matchedNote) {
            if (shouldUseEditKey) {
              return {
                status: 'forbidden',
                error: createInvalidEditKeyIntentError(
                  sid,
                  '当前对象还不存在，首次保存时不能直接使用编辑密钥，请改为设置密钥后再保存。'
                )
              }
            }

            if (!session) {
              if (shouldSetEditKey) {
                const editKeyHash = await editKeyService.hashKey(requireEditKey(normalizedEditKey))

                await transactionClient.$executeRawUnsafe(
                  noteInsertAnonymousWithKeySql,
                  sid,
                  input.content,
                  editKeyHash
                )

                return {
                  status: 'created',
                  note: createSuccessNote(sid, input.content, 'created', 'key-editable')
                }
              }

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

            if (shouldSetEditKey) {
              const editKeyHash = await editKeyService.hashKey(requireEditKey(normalizedEditKey))

              await transactionClient.$executeRawUnsafe(
                noteInsertOwnedWithKeySql,
                sid,
                input.content,
                toBigInt(matchedUser.id).toString(),
                editKeyHash
              )
            } else {
              await transactionClient.$executeRawUnsafe(
                noteInsertOwnedSql,
                sid,
                input.content,
                toBigInt(matchedUser.id).toString()
              )
            }

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

          const authorizationContext = await resolveNoteAuthorizationContext(
            {
              authorId: matchedNote.authorId,
              keyHash: matchedNote.keyHash
            },
            session,
            userRepository,
            isQueryClient(transactionClient) ? transactionClient : undefined
          )
          const responseFavoriteState =
            authorizationContext.actor === 'owner'
              ? 'self-owned'
              : authorizationContext.actorUserId != null
                ? (
                    await favoriteSummaryRepository.isFavoritedByUser(
                      matchedNote.id,
                      authorizationContext.actorUserId,
                      isQueryClient(transactionClient) ? transactionClient : undefined
                    )
                  )
                  ? 'favorited'
                  : 'not-favorited'
                : 'not-favorited'

          if (matchedNote.authorId != null) {
            if (authorizationContext.actor !== 'owner') {
              if (authorizationContext.hasEditKeyProtection) {
                if (!shouldUseEditKey) {
                  return {
                    status: 'forbidden',
                    error:
                      normalizedEditKey != null
                        ? createInvalidEditKeyIntentError(
                            sid,
                            '当前对象已启用编辑密钥，匿名协作者必须使用“使用密钥”语义保存。'
                          )
                        : createEditKeyRequiredError(sid)
                  }
                }

                const isValidEditKey = await editKeyService.verifyKey(
                  requireEditKey(normalizedEditKey),
                  requireStoredKeyHash(matchedNote.keyHash)
                )

                if (!isValidEditKey) {
                  return {
                    status: 'forbidden',
                    error: createEditKeyInvalidError(sid)
                  }
                }

                await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

                return {
                  status: 'updated',
                  note: createSuccessNote(
                    sid,
                    input.content,
                    'updated',
                    'key-editable',
                    responseFavoriteState
                  )
                }
              }

              return {
                status: 'forbidden',
                error: createForbiddenError(sid)
              }
            }

            if (shouldUseEditKey) {
              if (!matchedNote.keyHash) {
                return {
                  status: 'forbidden',
                  error: createInvalidEditKeyIntentError(
                    sid,
                    '当前对象尚未启用编辑密钥，请改为直接保存或设置密钥。'
                  )
                }
              }

              const isValidEditKey = await editKeyService.verifyKey(
                requireEditKey(normalizedEditKey),
                requireStoredKeyHash(matchedNote.keyHash)
              )

              if (!isValidEditKey) {
                return {
                  status: 'forbidden',
                  error: createEditKeyInvalidError(sid)
                }
              }

              await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

              return {
                status: 'updated',
                note: createSuccessNote(
                  sid,
                  input.content,
                  'updated',
                  'owner-editable',
                  responseFavoriteState
                )
              }
            }

            if (shouldSetEditKey) {
              const editKeyHash = await editKeyService.hashKey(requireEditKey(normalizedEditKey))

              await transactionClient.$executeRawUnsafe(
                noteUpdateWithKeySql,
                input.content,
                editKeyHash,
                matchedNote.id
              )
            } else {
              await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)
            }

            return {
              status: 'updated',
              note: createSuccessNote(
                sid,
                input.content,
                'updated',
                'owner-editable',
                responseFavoriteState
              )
            }
          }

          if (authorizationContext.hasEditKeyProtection) {
            if (!shouldUseEditKey) {
              return {
                status: 'forbidden',
                error:
                  normalizedEditKey != null
                    ? createInvalidEditKeyIntentError(
                        sid,
                        '当前对象已启用编辑密钥，必须使用现有密钥保存更新。'
                      )
                    : createEditKeyRequiredError(sid)
              }
            }

            const isValidEditKey = await editKeyService.verifyKey(
              requireEditKey(normalizedEditKey),
              requireStoredKeyHash(matchedNote.keyHash)
            )

            if (!isValidEditKey) {
              return {
                status: 'forbidden',
                error: createEditKeyInvalidError(sid)
              }
            }

            await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

            return {
              status: 'updated',
              note: createSuccessNote(
                sid,
                input.content,
                'updated',
                'key-editable',
                responseFavoriteState
              )
            }
          }

          if (shouldUseEditKey) {
            return {
              status: 'forbidden',
              error: createInvalidEditKeyIntentError(
                sid,
                '当前对象尚未启用编辑密钥，请改为直接保存或设置密钥。'
              )
            }
          }

          if (shouldSetEditKey) {
            const editKeyHash = await editKeyService.hashKey(requireEditKey(normalizedEditKey))

            await transactionClient.$executeRawUnsafe(
              noteUpdateWithKeySql,
              input.content,
              editKeyHash,
              matchedNote.id
            )

            return {
              status: 'updated',
              note: createSuccessNote(
                sid,
                input.content,
                'updated',
                'key-editable',
                responseFavoriteState
              )
            }
          }

          await transactionClient.$executeRawUnsafe(noteUpdateSql, input.content, matchedNote.id)

          return {
            status: 'updated',
            note: createSuccessNote(
              sid,
              input.content,
              'updated',
              'anonymous-editable',
              responseFavoriteState
            )
          }
        } finally {
          await transactionClient
            .$queryRawUnsafe(releaseSidWriteLockSql, lockName)
            .catch(() => undefined)
        }
      })
    },
    async deleteBySid(sid, editKey, session) {
      const prisma = await resolvePrismaClient()

      return prisma.$transaction(async (transactionClient) => {
        const lockName = await acquireWriteLock(transactionClient, sid)

        try {
          const matchedNotes = await transactionClient.$queryRawUnsafe<NoteWriteRecordRow[]>(
            noteWriteLookupSql,
            sid
          )

          if (matchedNotes.length > 1) {
            return {
              status: 'conflict',
              error: createDeleteConflictError(sid)
            }
          }

          const matchedNote = matchedNotes[0]

          if (!matchedNote) {
            return {
              status: 'not-found',
              error: createDeleteNotFoundError(sid)
            }
          }

          if (matchedNote.deletedAt) {
            return {
              status: 'already-deleted',
              error: createAlreadyDeletedError(sid)
            }
          }

          const authorizationContext = await resolveNoteAuthorizationContext(
            {
              authorId: matchedNote.authorId,
              keyHash: matchedNote.keyHash
            },
            session,
            userRepository,
            isQueryClient(transactionClient) ? transactionClient : undefined
          )
          const normalizedEditKey = editKey?.trim() ?? ''

          if (matchedNote.authorId != null) {
            if (authorizationContext.actor !== 'owner') {
              if (!authorizationContext.hasEditKeyProtection) {
                return {
                  status: 'forbidden',
                  error: createDeleteForbiddenError(sid)
                }
              }

              if (!normalizedEditKey) {
                return {
                  status: 'forbidden',
                  error: createDeleteEditKeyRequiredError(sid)
                }
              }

              const isValidEditKey = await editKeyService.verifyKey(
                normalizedEditKey,
                requireStoredKeyHash(matchedNote.keyHash)
              )

              if (!isValidEditKey) {
                return {
                  status: 'forbidden',
                  error: createDeleteEditKeyInvalidError(sid)
                }
              }
            }
          } else if (authorizationContext.hasEditKeyProtection) {
            if (!normalizedEditKey) {
              return {
                status: 'forbidden',
                error: createDeleteEditKeyRequiredError(sid)
              }
            }

            const isValidEditKey = await editKeyService.verifyKey(
              normalizedEditKey,
              requireStoredKeyHash(matchedNote.keyHash)
            )

            if (!isValidEditKey) {
              return {
                status: 'forbidden',
                error: createDeleteEditKeyInvalidError(sid)
              }
            }
          }

          await transactionClient.$executeRawUnsafe(noteDeleteSql, matchedNote.id)

          return {
            status: 'deleted',
            note: createDeleteSuccessNote(sid)
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
    },
    deleteBySid(sid, editKey, session) {
      return repository.deleteBySid(sid, editKey, session)
    }
  }
}
