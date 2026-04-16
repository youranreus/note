// @vitest-environment jsdom

import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import {
  LOCAL_NOTE_DB_NAME,
  createIndexedDbLocalNoteStorage,
  createLocalNoteRecord,
  resolveLocalNoteStorage
} from '../src/features/local-note/storage/local-note-storage'

async function resetLocalNoteDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(LOCAL_NOTE_DB_NAME)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('delete database blocked'))
  })
}

function getLocalNoteStorage() {
  const storage = resolveLocalNoteStorage()

  if (!storage) {
    throw new Error('expected indexedDB local note storage to be available')
  }

  return storage
}

describe('local note indexedDB storage', () => {
  beforeEach(async () => {
    await resetLocalNoteDatabase()
  })

  it('writes and reads a local note record by sid', async () => {
    const storage = getLocalNoteStorage()
    const record = createLocalNoteRecord(
      'local-a',
      '第一条本地正文',
      '2026-04-04T10:00:00.000Z'
    )

    await expect(storage.writeRecord(record)).resolves.toEqual(record)
    await expect(storage.readRecord('local-a')).resolves.toEqual(record)
  })

  it('lists summaries in updatedAt descending order', async () => {
    const storage = getLocalNoteStorage()

    await storage.writeRecord(
      createLocalNoteRecord('local-a', '第一条便签\n\n包含多余空白', '2026-04-04T09:00:00.000Z')
    )
    await storage.writeRecord(
      createLocalNoteRecord('local-b', '第二条便签，时间更新', '2026-04-04T11:00:00.000Z')
    )

    await expect(storage.listSummaries()).resolves.toEqual([
      {
        sid: 'local-b',
        updatedAt: '2026-04-04T11:00:00.000Z',
        contentLength: '第二条便签，时间更新'.length,
        excerpt: '第二条便签，时间更新'
      },
      {
        sid: 'local-a',
        updatedAt: '2026-04-04T09:00:00.000Z',
        contentLength: '第一条便签\n\n包含多余空白'.length,
        excerpt: '第一条便签 包含多余空白'
      }
    ])
  })

  it('returns 空白便签 excerpt for blank content', async () => {
    const storage = getLocalNoteStorage()

    await storage.writeRecord(createLocalNoteRecord('blank-note', '  \n\t  ', '2026-04-04T11:00:00.000Z'))

    await expect(storage.listSummaries()).resolves.toEqual([
      {
        sid: 'blank-note',
        updatedAt: '2026-04-04T11:00:00.000Z',
        contentLength: '  \n\t  '.length,
        excerpt: '空白便签'
      }
    ])
  })

  it('reports storage unavailable when indexedDB cannot be created', async () => {
    const storage = createIndexedDbLocalNoteStorage({
      cmp: indexedDB.cmp.bind(indexedDB),
      databases:
        'databases' in indexedDB && typeof indexedDB.databases === 'function'
          ? indexedDB.databases.bind(indexedDB)
          : undefined,
      deleteDatabase: indexedDB.deleteDatabase.bind(indexedDB),
      open: () => {
        throw new Error('indexedDB disabled')
      }
    } as IDBFactory)

    await expect(storage.readRecord('broken')).rejects.toMatchObject({
      code: 'LOCAL_NOTE_STORAGE_OPEN_FAILED'
    })
  })
})
