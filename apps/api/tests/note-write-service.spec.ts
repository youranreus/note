import { describe, expect, it } from 'vitest'

import {
  createPrismaNoteWriteRepository,
  createNoteWriteService
} from '../src/services/note-write-service.js'
import { NoteSidConflictError } from '../src/services/note-read-service.js'

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
    })

    expect(result).toEqual({
      status: 'created',
      note: {
        sid: 'new123',
        content: '第一次写入。',
        status: 'available',
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
    })

    expect(result).toEqual({
      status: 'updated',
      note: {
        sid: 'existing123',
        content: '更新后的内容。',
        status: 'available',
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
      })
    ).rejects.toBeInstanceOf(NoteSidConflictError)
    expect(harness.insertedValues).toEqual([])
    expect(harness.updatedValues).toEqual([])
    expect(harness.releasedLocks).toEqual(['notes:write:conflict123'])
  })
})
