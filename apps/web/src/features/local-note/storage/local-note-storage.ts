export const LOCAL_NOTE_STORAGE_PREFIX = 'note:local:'

export type LocalNoteStorageErrorCode =
  | 'LOCAL_NOTE_STORAGE_UNAVAILABLE'
  | 'LOCAL_NOTE_READ_FAILED'
  | 'LOCAL_NOTE_WRITE_FAILED'
  | 'LOCAL_NOTE_INVALID_RECORD'

export interface LocalNoteStorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface LocalNoteRecord {
  sid: string
  content: string
  updatedAt: string
}

export class LocalNoteStorageError extends Error {
  code: LocalNoteStorageErrorCode

  constructor(code: LocalNoteStorageErrorCode, message: string) {
    super(message)
    this.name = 'LocalNoteStorageError'
    this.code = code
  }
}

export function createLocalNoteStorageKey(sid: string) {
  return `${LOCAL_NOTE_STORAGE_PREFIX}${sid}`
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

export function resolveLocalNoteStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readLocalNoteRecord(storage: LocalNoteStorageLike, sid: string) {
  const key = createLocalNoteStorageKey(sid)
  let rawValue: string | null

  try {
    rawValue = storage.getItem(key)
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_READ_FAILED',
      '读取当前本地便签失败，请检查浏览器本地存储权限后重试。'
    )
  }

  if (rawValue === null) {
    return null
  }

  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(rawValue)
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_INVALID_RECORD',
      '当前 sid 的本地内容无法读取，可能已经损坏。你可以继续编辑并重新保存覆盖它。'
    )
  }

  if (!isLocalNoteRecord(parsedValue) || parsedValue.sid !== sid) {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_INVALID_RECORD',
      '当前 sid 的本地内容无法读取，可能已经损坏。你可以继续编辑并重新保存覆盖它。'
    )
  }

  return parsedValue
}

export function writeLocalNoteRecord(
  storage: LocalNoteStorageLike,
  record: LocalNoteRecord
) {
  const key = createLocalNoteStorageKey(record.sid)

  try {
    storage.setItem(key, JSON.stringify(record))
  } catch {
    throw new LocalNoteStorageError(
      'LOCAL_NOTE_WRITE_FAILED',
      '保存当前本地便签失败，请检查浏览器本地存储权限或可用空间后重试。'
    )
  }

  return record
}
