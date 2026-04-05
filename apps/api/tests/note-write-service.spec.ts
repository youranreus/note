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

function createFakePrismaHarness(lookupRows: Array<Record<string, unknown>>): FakePrismaHarness {
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
        saveResult: 'updated'
      }
    })
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([['更新后的内容。', 42]])
    expect(harness.releasedLocks).toEqual(['notes:write:existing123'])
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
})
