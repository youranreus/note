import { describe, expect, it } from 'vitest'

import {
  createPrismaNoteWriteRepository,
  createNoteWriteService
} from '../src/services/note-write-service.js'
import { NoteSidConflictError } from '../src/services/note-read-service.js'
import type { AuthenticatedSessionDto } from '@note/shared-types'

interface QueryCall {
  sql: string
  values: unknown[]
}

interface FakePrismaHarness {
  prismaClient: {
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>
    $transaction<T>(callback: (transactionClient: FakeTransactionalClient) => Promise<T>): Promise<T>
  }
  queryCalls: QueryCall[]
  executeCalls: QueryCall[]
  insertedValues: unknown[][]
  updatedValues: unknown[][]
  releasedLocks: string[]
  insertedUsers: unknown[][]
}

interface FakeTransactionalClient {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>
}

function createFakePrismaHarness(
  lookupRows: Array<Record<string, unknown>>,
  favoriteLookupRows: Array<Record<string, unknown>> = []
): FakePrismaHarness {
  const queryCalls: QueryCall[] = []
  const executeCalls: QueryCall[] = []
  const insertedValues: unknown[][] = []
  const updatedValues: unknown[][] = []
  const releasedLocks: string[] = []
  const insertedUsers: unknown[][] = []

  const transactionClient: FakeTransactionalClient = {
    async $queryRawUnsafe<T = unknown>(sql: string, ...values: unknown[]) {
      queryCalls.push({
        sql,
        values
      })

      if (sql.startsWith('SELECT GET_LOCK')) {
        return [{ acquired: 1 }] as T
      }

      if (sql.includes('FROM notes WHERE sid = ?')) {
        return lookupRows as T
      }

      if (sql.includes('FROM users WHERE sso_id = ?')) {
        return [{ id: 7, ssoId: values[0] }] as T
      }

      if (sql.includes('FROM note_favorites WHERE note_id = ? AND user_id = ?')) {
        return favoriteLookupRows as T
      }

      if (sql.startsWith('SELECT RELEASE_LOCK')) {
        releasedLocks.push(String(values[0] ?? ''))
        return [] as T
      }

      throw new Error(`Unexpected query: ${sql}`)
    },
    async $executeRawUnsafe(sql: string, ...values: unknown[]) {
      executeCalls.push({
        sql,
        values
      })

      if (sql.startsWith('INSERT INTO notes')) {
        insertedValues.push(values)
        return 1
      }

      if (sql.startsWith('INSERT IGNORE INTO users')) {
        insertedUsers.push(values)
        return 1
      }

      if (sql.startsWith('UPDATE notes SET content = ?')) {
        updatedValues.push(values)
        return 1
      }

      throw new Error(`Unexpected execute: ${sql}`)
    }
  }

  return {
    prismaClient: {
      $queryRawUnsafe: transactionClient.$queryRawUnsafe,
      $executeRawUnsafe: transactionClient.$executeRawUnsafe,
      async $transaction<T>(callback: (transactionClient: FakeTransactionalClient) => Promise<T>) {
        return callback(transactionClient)
      }
    },
    queryCalls,
    executeCalls,
    insertedValues,
    updatedValues,
    releasedLocks
    ,
    insertedUsers
  }
}

function createFakeEditKeyService() {
  return {
    async hashKey(key: string) {
      return `hashed:${key}`
    },
    async verifyKey(key: string, storedHash: string) {
      return storedHash === `hashed:${key}`
    }
  }
}

function createAuthenticatedSession(userId = '1001'): AuthenticatedSessionDto {
  return {
    status: 'authenticated',
    user: {
      id: userId,
      displayName: 'Demo User'
    }
  }
}

describe('note write service', () => {
  it('acquires a sid lock, inserts the first record, and releases the lock afterwards', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid('new123', {
      content: '第一次写入。'
    }, null)

    expect(result).toEqual({
      status: 'created',
      note: {
        sid: 'new123',
        content: '第一次写入。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited',
        saveResult: 'created'
      }
    })
    expect(harness.insertedValues).toEqual([['new123', '第一次写入。']])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:new123'])
  })

  it('updates an existing record in place and still releases the sid lock', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'existing123',
        content: '旧内容。',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid('existing123', {
      content: '更新后的内容。'
    }, null)

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'existing123',
        content: '更新后的内容。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited',
        saveResult: 'updated'
      }
    })
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([['更新后的内容。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:existing123'])
  })

  it('preserves favoriteState when an authenticated user saves an already favorited anonymous note', async () => {
    const harness = createFakePrismaHarness(
      [
        {
          id: 42,
          sid: 'shared123',
          content: '旧内容。',
          authorId: null,
          keyHash: null,
          deletedAt: null
        }
      ],
      [{ matched: 1 }]
    )
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '登录后再次编辑。'
      },
      createAuthenticatedSession()
    )

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'shared123',
        content: '登录后再次编辑。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'favorited',
        saveResult: 'updated'
      }
    })
    expect(harness.updatedValues).toEqual([['登录后再次编辑。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('releases the sid lock even when duplicate sid rows trigger a conflict', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 1,
        sid: 'conflict123',
        content: 'A',
        deletedAt: null
      },
      {
        id: 2,
        sid: 'conflict123',
        content: 'B',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    await expect(
      service.saveBySid('conflict123', {
        content: '不应被写入。'
      }, null)
    ).rejects.toBeInstanceOf(NoteSidConflictError)
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:conflict123'])
  })

  it('binds the author when an authenticated user creates a new note', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'owner123',
      {
        content: '由创建者首次保存。'
      },
      createAuthenticatedSession()
    )

    expect(result).toEqual({
      status: 'created',
      note: {
        sid: 'owner123',
        content: '由创建者首次保存。',
        status: 'available',
        editAccess: 'owner-editable',
        favoriteState: 'self-owned',
        saveResult: 'created'
      }
    })
    expect(harness.insertedUsers).toEqual([['1001']])
    expect(harness.insertedValues).toEqual([['owner123', '由创建者首次保存。', '7']])
    expect(harness.releasedLocks).toEqual(['notes:write:owner123'])
  })

  it('rejects updates when the current session does not match the bound owner', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'owned123',
        content: '旧内容。',
        authorId: 9,
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'owned123',
      {
        content: '不应写入。'
      },
      createAuthenticatedSession('1001')
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'owned123',
        code: 'NOTE_FORBIDDEN',
        status: 'forbidden',
        message: '当前账户不能修改这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
      }
    })
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:owned123'])
  })

  it('allows the owner to set an edit key while updating an existing owned note', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'owned123',
        content: '旧内容。',
        authorId: 7,
        keyHash: null,
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'owned123',
      {
        content: '带共享密钥的新正文。',
        editKey: 'shared-secret',
        editKeyAction: 'set'
      },
      createAuthenticatedSession('1001')
    )

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'owned123',
        content: '带共享密钥的新正文。',
        status: 'available',
        editAccess: 'owner-editable',
        favoriteState: 'self-owned',
        saveResult: 'updated'
      }
    })
    expect(harness.updatedValues).toEqual([['带共享密钥的新正文。', 'hashed:shared-secret', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:owned123'])
  })

  it('still lets the owner update a keyed owned note without re-entering the edit key', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'owned123',
        content: '旧内容。',
        authorId: 7,
        keyHash: 'hashed:shared-secret',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'owned123',
      {
        content: '创建者继续更新。'
      },
      createAuthenticatedSession('1001')
    )

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'owned123',
        content: '创建者继续更新。',
        status: 'available',
        editAccess: 'owner-editable',
        favoriteState: 'self-owned',
        saveResult: 'updated'
      }
    })
    expect(harness.updatedValues).toEqual([['创建者继续更新。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:owned123'])
  })

  it('creates an anonymous shared-edit note when the first save sets an edit key', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '带密钥的首版正文。',
        editKey: 'shared-secret',
        editKeyAction: 'set'
      },
      null
    )

    expect(result).toEqual({
      status: 'created',
      note: {
        sid: 'shared123',
        content: '带密钥的首版正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited',
        saveResult: 'created'
      }
    })
    expect(harness.insertedValues).toEqual([['shared123', '带密钥的首版正文。', 'hashed:shared-secret']])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('rejects a provided edit key when the request does not declare whether it is set or use', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '带密钥但未声明用途的正文。',
        editKey: 'shared-secret'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_ACTION_INVALID',
        status: 'forbidden',
        message: '当前请求提供了编辑密钥，但没有声明要设置还是使用该密钥。'
      }
    })
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('rejects setting an edit key with an empty value instead of silently falling back', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '尝试设置空白密钥的正文。',
        editKey: '   ',
        editKeyAction: 'set'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_REQUIRED',
        status: 'forbidden',
        message: '设置编辑密钥时必须提供非空密钥。'
      }
    })
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('requires an edit key when updating an existing keyed anonymous note', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'shared123',
        content: '旧正文。',
        authorId: null,
        keyHash: 'hashed:shared-secret',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '新正文。'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_REQUIRED',
        status: 'forbidden',
        message: '当前对象需要输入编辑密钥后才能保存更新。'
      }
    })
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('rejects use-mode saves for notes that do not have edit-key protection', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'shared123',
        content: '旧正文。',
        authorId: null,
        keyHash: null,
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '新正文。',
        editKey: 'shared-secret',
        editKeyAction: 'use'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_ACTION_INVALID',
        status: 'forbidden',
        message: '当前对象尚未启用编辑密钥，请改为直接保存或设置密钥。'
      }
    })
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('rejects an invalid edit key for a keyed anonymous note', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'shared123',
        content: '旧正文。',
        authorId: null,
        keyHash: 'hashed:shared-secret',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '新正文。',
        editKey: 'wrong-secret',
        editKeyAction: 'use'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_INVALID',
        status: 'forbidden',
        message: '当前编辑密钥不正确，请确认后重试。'
      }
    })
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('allows updates with the correct edit key for a keyed anonymous note', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'shared123',
        content: '旧正文。',
        authorId: null,
        keyHash: 'hashed:shared-secret',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '新正文。',
        editKey: 'shared-secret',
        editKeyAction: 'use'
      },
      null
    )

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'shared123',
        content: '新正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited',
        saveResult: 'updated'
      }
    })
    expect(harness.updatedValues).toEqual([['新正文。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })

  it('allows a non-owner collaborator to update an owner-bound keyed note with the correct key', async () => {
    const harness = createFakePrismaHarness([
      {
        id: 42,
        sid: 'owner-keyed123',
        content: '旧正文。',
        authorId: 9,
        keyHash: 'hashed:shared-secret',
        deletedAt: null
      }
    ])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'owner-keyed123',
      {
        content: '协作者新正文。',
        editKey: 'shared-secret',
        editKeyAction: 'use'
      },
      createAuthenticatedSession('2002')
    )

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'owner-keyed123',
        content: '协作者新正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited',
        saveResult: 'updated'
      }
    })
    expect(harness.updatedValues).toEqual([['协作者新正文。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:owner-keyed123'])
  })

  it('rejects unsupported edit key actions instead of silently treating them as no-op', async () => {
    const harness = createFakePrismaHarness([])
    const repository = createPrismaNoteWriteRepository({
      getPrismaClient: async () => harness.prismaClient,
      editKeyService: createFakeEditKeyService()
    })
    const service = createNoteWriteService(repository)

    const result = await service.saveBySid(
      'shared123',
      {
        content: '带无效操作的正文。',
        editKey: 'shared-secret',
        editKeyAction: 'swap' as 'set'
      },
      null
    )

    expect(result).toEqual({
      status: 'forbidden',
      error: {
        sid: 'shared123',
        code: 'NOTE_EDIT_KEY_ACTION_INVALID',
        status: 'forbidden',
        message: '当前请求中的编辑密钥操作无效，请改为使用 set 或 use 后重试。'
      }
    })
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:shared123'])
  })
})
