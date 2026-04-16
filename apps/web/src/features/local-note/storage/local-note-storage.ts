export type LocalNoteStorageErrorCode =
  | 'LOCAL_NOTE_STORAGE_UNAVAILABLE'
  | 'LOCAL_NOTE_STORAGE_OPEN_FAILED'
  | 'LOCAL_NOTE_READ_FAILED'
  | 'LOCAL_NOTE_WRITE_FAILED'
  | 'LOCAL_NOTE_LIST_FAILED'
  | 'LOCAL_NOTE_INVALID_RECORD'

export interface LocalNoteStorageLike {
  readRecord: (sid: string) => Promise<LocalNoteRecord | null>
  writeRecord: (record: LocalNoteRecord) => Promise<LocalNoteRecord>
  listSummaries: () => Promise<LocalNoteSummary[]>
}

export interface LocalNoteRecord {
  sid: string
  content: string
  updatedAt: string
}

export interface LocalNoteSummary {
  sid: string
  updatedAt: string
  contentLength: number
  excerpt: string
}

export const LOCAL_NOTE_DB_NAME = 'noteLocalNotes'
const LOCAL_NOTE_DB_VERSION = 1
const LOCAL_NOTE_STORE_NAME = 'localNotes'
const LOCAL_NOTE_UPDATED_AT_INDEX = 'updatedAt'
const LOCAL_NOTE_EXCERPT_MAX_LENGTH = 80

export class LocalNoteStorageError extends Error {
  code: LocalNoteStorageErrorCode

  constructor(code: LocalNoteStorageErrorCode, message: string) {
    super(message)
    this.name = 'LocalNoteStorageError'
    this.code = code
  }
}

export function createLocalNoteRecord(
  sid: string,
  content: string,
  updatedAt = new Date().toISOString()
): LocalNoteRecord {
  return {
    sid,
    content,
    updatedAt
  }
}

export function isLocalNoteRecord(value: unknown): value is LocalNoteRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<LocalNoteRecord>

  return (
    typeof candidate.sid === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export function isLocalNoteStorageError(error: unknown): error is LocalNoteStorageError {
  return error instanceof LocalNoteStorageError
}

export function createLocalNoteSummary(record: LocalNoteRecord): LocalNoteSummary {
  const normalizedContent = record.content.replace(/\s+/gu, ' ').trim()

  return {
    sid: record.sid,
    updatedAt: record.updatedAt,
    contentLength: record.content.length,
    excerpt:
      normalizedContent === '' ? '空白便签' : normalizedContent.slice(0, LOCAL_NOTE_EXCERPT_MAX_LENGTH)
  }
}

export function resolveLocalNoteStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    if (!('indexedDB' in window) || !window.indexedDB) {
      return null
    }

    return createIndexedDbLocalNoteStorage(window.indexedDB)
  } catch {
    return null
  }
}

export function createIndexedDbLocalNoteStorage(indexedDb: IDBFactory): LocalNoteStorageLike {
  let databasePromise: Promise<IDBDatabase> | null = null

  function openDatabase() {
    if (databasePromise) {
      return databasePromise
    }

    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest

      try {
        request = indexedDb.open(LOCAL_NOTE_DB_NAME, LOCAL_NOTE_DB_VERSION)
      } catch {
        reject(
          new LocalNoteStorageError(
            'LOCAL_NOTE_STORAGE_OPEN_FAILED',
            '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
          )
        )
        return
      }

      request.onupgradeneeded = () => {
        const database = request.result
        const store = database.objectStoreNames.contains(LOCAL_NOTE_STORE_NAME)
          ? request.transaction?.objectStore(LOCAL_NOTE_STORE_NAME) ?? null
          : database.createObjectStore(LOCAL_NOTE_STORE_NAME, {
              keyPath: 'sid'
            })

        if (store && !store.indexNames.contains(LOCAL_NOTE_UPDATED_AT_INDEX)) {
          store.createIndex(LOCAL_NOTE_UPDATED_AT_INDEX, 'updatedAt')
        }
      }

      request.onsuccess = () => {
        const database = request.result

        database.onversionchange = () => {
          database.close()
          databasePromise = null
        }

        resolve(database)
      }

      request.onerror = () => {
        databasePromise = null
        reject(
          new LocalNoteStorageError(
            'LOCAL_NOTE_STORAGE_OPEN_FAILED',
            '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
          )
        )
      }
    })

    return databasePromise
  }

  async function withStore<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => Promise<T>
  ) {
    const database = await openDatabase()
    const transaction = database.transaction(LOCAL_NOTE_STORE_NAME, mode)
    const store = transaction.objectStore(LOCAL_NOTE_STORE_NAME)

    return callback(store)
  }

  return {
    async readRecord(sid) {
      return withStore('readonly', async (store) => readLocalNoteRecord(store, sid))
    },
    async writeRecord(record) {
      return withStore('readwrite', async (store) => writeLocalNoteRecord(store, record))
    },
    async listSummaries() {
      return withStore('readonly', async (store) => listLocalNoteSummaries(store))
    }
  }
}

function readLocalNoteRecord(store: IDBObjectStore, sid: string) {
  let request: IDBRequest<unknown>

  try {
    request = store.get(sid)
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_READ_FAILED',
      '读取当前本地便签失败，请检查浏览器本地存储权限后重试。'
    )
  }

  return new Promise<LocalNoteRecord | null>((resolve, reject) => {
    request.onsuccess = () => {
      const record = request.result

      if (record === undefined) {
        resolve(null)
        return
      }

      if (!isLocalNoteRecord(record) || record.sid !== sid) {
        reject(
          new LocalNoteStorageError(
            'LOCAL_NOTE_INVALID_RECORD',
            '当前 sid 的本地内容无法读取，可能已经损坏。你可以继续编辑并重新保存覆盖它。'
          )
        )
        return
      }

      resolve(record)
    }

    request.onerror = () => {
      reject(
        new LocalNoteStorageError(
          'LOCAL_NOTE_READ_FAILED',
          '读取当前本地便签失败，请检查浏览器本地存储权限后重试。'
        )
      )
    }
  })
}

function writeLocalNoteRecord(store: IDBObjectStore, record: LocalNoteRecord) {
  let request: IDBRequest<IDBValidKey>

  try {
    request = store.put(record)
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_WRITE_FAILED',
      '保存当前本地便签失败，请检查浏览器本地存储权限或可用空间后重试。'
    )
  }

  return new Promise<LocalNoteRecord>((resolve, reject) => {
    request.onsuccess = () => resolve(record)
    request.onerror = () => {
      reject(
        new LocalNoteStorageError(
          'LOCAL_NOTE_WRITE_FAILED',
          '保存当前本地便签失败，请检查浏览器本地存储权限或可用空间后重试。'
        )
      )
    }
  })
}

function listLocalNoteSummaries(store: IDBObjectStore) {
  let request: IDBRequest<LocalNoteRecord[]>

  try {
    request = store.index(LOCAL_NOTE_UPDATED_AT_INDEX).getAll()
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_LIST_FAILED',
      '读取本地便签列表失败，请稍后重试。'
    )
  }

  return new Promise<LocalNoteSummary[]>((resolve, reject) => {
    request.onsuccess = () => {
      const records = request.result.filter(isLocalNoteRecord)

      resolve(records.reverse().map(createLocalNoteSummary))
    }

    request.onerror = () => {
      reject(
        new LocalNoteStorageError(
          'LOCAL_NOTE_LIST_FAILED',
          '读取本地便签列表失败，请稍后重试。'
        )
      )
    }
  })
}
