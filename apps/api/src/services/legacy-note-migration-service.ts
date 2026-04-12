import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  createNoteEditKeyService,
  type NoteEditKeyService
} from './note-edit-key-service.js'
import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaTransactionalClientLike
} from './prisma-client.js'

type SqlScalar = bigint | string | null

interface CountRow {
  total: bigint | number | string
}

export interface LegacyUserRecord {
  id: bigint
  ssoId: bigint
}

export interface LegacyNoteRecord {
  id: bigint
  key: string | null
  content: string
  sid: string
  authorSsoId: bigint | null
}

export interface LegacyNoteOnUserRecord {
  noteId: bigint
  userSsoId: bigint
  assignedAt: string
  assignedBy: string
}

export interface LegacyMemoDump {
  users: LegacyUserRecord[]
  notes: LegacyNoteRecord[]
  noteOnUsers: LegacyNoteOnUserRecord[]
}

export interface LegacyDumpSummary {
  userCount: number
  noteCount: number
  noteOnUserCount: number
  hashedKeyCount: number
}

export interface LegacyMigrationSummary extends LegacyDumpSummary {
  targetUserCount: number
  targetNoteCount: number
  targetFavoriteCount: number
}

export interface MigrateLegacyMemoDumpOptions {
  inputPath: string
  requireEmptyTarget?: boolean
  resetTarget?: boolean
  getPrismaClient?: () => Promise<PrismaClientLike>
  editKeyService?: NoteEditKeyService
  importedAt?: Date
}

const insertStatementPrefixByTable = {
  user: 'INSERT INTO `user` VALUES ',
  note: 'INSERT INTO `note` VALUES ',
  noteonusers: 'INSERT INTO `noteonusers` VALUES '
} as const

const targetTableCountSql = {
  users: 'SELECT COUNT(*) AS total FROM users',
  notes: 'SELECT COUNT(*) AS total FROM notes',
  favorites: 'SELECT COUNT(*) AS total FROM note_favorites'
} as const

const targetUserInsertSqlPrefix = 'INSERT INTO users (id, sso_id, created_at, updated_at) VALUES'
const targetNoteInsertSqlPrefix =
  'INSERT INTO notes (id, sid, content, key_hash, author_id, created_at, updated_at, deleted_at) VALUES'
const targetFavoriteInsertSqlPrefix =
  'INSERT INTO note_favorites (note_id, user_id, created_at) VALUES'
const insertBatchSize = 100

function decodeMySqlEscapeCharacter(character: string) {
  switch (character) {
    case '0':
      return '\0'
    case 'b':
      return '\b'
    case 'n':
      return '\n'
    case 'r':
      return '\r'
    case 't':
      return '\t'
    case 'Z':
      return '\u001a'
    default:
      return character
  }
}

function skipWhitespace(source: string, startIndex: number) {
  let index = startIndex

  while (index < source.length && /\s/u.test(source[index] ?? '')) {
    index += 1
  }

  return index
}

function parseQuotedSqlString(source: string, startIndex: number) {
  let index = startIndex + 1
  let value = ''

  while (index < source.length) {
    const currentCharacter = source[index]

    if (currentCharacter === '\\') {
      const escapedCharacter = source[index + 1]

      if (escapedCharacter == null) {
        throw new Error('Legacy SQL dump contains an unterminated escape sequence.')
      }

      value += decodeMySqlEscapeCharacter(escapedCharacter)
      index += 2
      continue
    }

    if (currentCharacter === "'") {
      if (source[index + 1] === "'") {
        value += "'"
        index += 2
        continue
      }

      return {
        nextIndex: index + 1,
        value
      }
    }

    value += currentCharacter
    index += 1
  }

  throw new Error('Legacy SQL dump contains an unterminated quoted string.')
}

function parseUnquotedSqlValue(source: string, startIndex: number) {
  let index = startIndex

  while (index < source.length) {
    const currentCharacter = source[index]

    if (currentCharacter === ',' || currentCharacter === ')' || /\s/u.test(currentCharacter ?? '')) {
      break
    }

    index += 1
  }

  const token = source.slice(startIndex, index)

  if (token === 'NULL') {
    return {
      nextIndex: index,
      value: null
    }
  }

  if (/^-?\d+$/u.test(token)) {
    return {
      nextIndex: index,
      value: BigInt(token)
    }
  }

  throw new Error(`Legacy SQL dump contains an unsupported token: "${token}".`)
}

function parseSqlValue(source: string, startIndex: number) {
  const normalizedStartIndex = skipWhitespace(source, startIndex)
  const currentCharacter = source[normalizedStartIndex]

  if (currentCharacter === "'") {
    return parseQuotedSqlString(source, normalizedStartIndex)
  }

  return parseUnquotedSqlValue(source, normalizedStartIndex)
}

function parseInsertRows(valuesSection: string) {
  const rows: SqlScalar[][] = []
  let index = 0

  while (index < valuesSection.length) {
    index = skipWhitespace(valuesSection, index)

    if (index >= valuesSection.length) {
      break
    }

    if (valuesSection[index] === ',') {
      index += 1
      continue
    }

    if (valuesSection[index] !== '(') {
      throw new Error(
        `Legacy SQL dump parser expected "(" at index ${index}, received "${valuesSection[index]}".`
      )
    }

    index += 1
    const row: SqlScalar[] = []

    while (index < valuesSection.length) {
      const parsedValue = parseSqlValue(valuesSection, index)
      row.push(parsedValue.value)
      index = skipWhitespace(valuesSection, parsedValue.nextIndex)

      const currentCharacter = valuesSection[index]

      if (currentCharacter === ',') {
        index += 1
        continue
      }

      if (currentCharacter === ')') {
        index += 1
        rows.push(row)
        break
      }

      throw new Error(
        `Legacy SQL dump parser expected "," or ")" at index ${index}, received "${currentCharacter}".`
      )
    }
  }

  return rows
}

function collectInsertValueSections(
  sql: string,
  tableName: keyof typeof insertStatementPrefixByTable
) {
  const valuesSections: string[] = []
  const statementPrefix = insertStatementPrefixByTable[tableName]
  let searchStartIndex = 0

  while (searchStartIndex < sql.length) {
    const statementStartIndex = sql.indexOf(statementPrefix, searchStartIndex)

    if (statementStartIndex < 0) {
      break
    }

    const valuesStartIndex = statementStartIndex + statementPrefix.length
    let index = valuesStartIndex
    let inQuotedString = false

    while (index < sql.length) {
      const currentCharacter = sql[index]

      if (inQuotedString && currentCharacter === '\\') {
        index += 2
        continue
      }

      if (currentCharacter === "'") {
        if (inQuotedString && sql[index + 1] === "'") {
          index += 2
          continue
        }

        inQuotedString = !inQuotedString
        index += 1
        continue
      }

      if (!inQuotedString && currentCharacter === ';') {
        valuesSections.push(sql.slice(valuesStartIndex, index))
        searchStartIndex = index + 1
        break
      }

      index += 1
    }

    if (index >= sql.length) {
      throw new Error(`Legacy SQL dump contains an unterminated INSERT statement for table "${tableName}".`)
    }
  }

  return valuesSections
}

function collectInsertRows(sql: string, tableName: keyof typeof insertStatementPrefixByTable) {
  const rows: SqlScalar[][] = []

  for (const valuesSection of collectInsertValueSections(sql, tableName)) {
    rows.push(...parseInsertRows(valuesSection))
  }

  return rows
}

function requireBigIntValue(value: SqlScalar, tableName: string, columnName: string) {
  if (typeof value !== 'bigint') {
    throw new Error(`Legacy ${tableName}.${columnName} must be an integer value.`)
  }

  return value
}

function requireStringValue(value: SqlScalar, tableName: string, columnName: string) {
  if (typeof value !== 'string') {
    throw new Error(`Legacy ${tableName}.${columnName} must be a string value.`)
  }

  return value
}

function expectColumnCount(row: SqlScalar[], expectedColumnCount: number, tableName: string) {
  if (row.length !== expectedColumnCount) {
    throw new Error(
      `Legacy ${tableName} row should contain ${expectedColumnCount} columns, received ${row.length}.`
    )
  }
}

function mapLegacyUsers(rows: SqlScalar[][]): LegacyUserRecord[] {
  return rows.map((row) => {
    expectColumnCount(row, 2, 'user')

    return {
      id: requireBigIntValue(row[0], 'user', 'id'),
      ssoId: requireBigIntValue(row[1], 'user', 'ssoId')
    }
  })
}

function mapLegacyNotes(rows: SqlScalar[][]): LegacyNoteRecord[] {
  return rows.map((row) => {
    expectColumnCount(row, 5, 'note')

    const key = row[1]
    const authorSsoId = row[4]

    if (key !== null && typeof key !== 'string') {
      throw new Error('Legacy note.key must be either NULL or a string.')
    }

    if (authorSsoId !== null && typeof authorSsoId !== 'bigint') {
      throw new Error('Legacy note.authorId must be either NULL or an integer ssoId.')
    }

    return {
      id: requireBigIntValue(row[0], 'note', 'id'),
      key,
      content: requireStringValue(row[2], 'note', 'content'),
      sid: requireStringValue(row[3], 'note', 'sid'),
      authorSsoId
    }
  })
}

function mapLegacyNoteOnUsers(rows: SqlScalar[][]): LegacyNoteOnUserRecord[] {
  return rows.map((row) => {
    expectColumnCount(row, 4, 'noteonusers')

    return {
      noteId: requireBigIntValue(row[0], 'noteonusers', 'noteId'),
      userSsoId: requireBigIntValue(row[1], 'noteonusers', 'userId'),
      assignedAt: requireStringValue(row[2], 'noteonusers', 'assignedAt'),
      assignedBy: requireStringValue(row[3], 'noteonusers', 'assignedBy')
    }
  })
}

export function parseLegacyMemoSqlDump(sql: string): LegacyMemoDump {
  return {
    users: mapLegacyUsers(collectInsertRows(sql, 'user')),
    notes: mapLegacyNotes(collectInsertRows(sql, 'note')),
    noteOnUsers: mapLegacyNoteOnUsers(collectInsertRows(sql, 'noteonusers'))
  }
}

export function summarizeLegacyMemoDump(dump: LegacyMemoDump): LegacyDumpSummary {
  return {
    userCount: dump.users.length,
    noteCount: dump.notes.length,
    noteOnUserCount: dump.noteOnUsers.length,
    hashedKeyCount: dump.notes.filter((note) => note.key != null && note.key !== '').length
  }
}

export function validateLegacyMemoDump(dump: LegacyMemoDump) {
  const userIdSet = new Set<string>()
  const userSsoIdSet = new Set<string>()
  const noteIdSet = new Set<string>()
  const noteSidSet = new Set<string>()

  for (const user of dump.users) {
    const userIdKey = user.id.toString()
    const userSsoIdKey = user.ssoId.toString()

    if (userIdSet.has(userIdKey)) {
      throw new Error(`Legacy users contain duplicate id "${userIdKey}".`)
    }

    if (userSsoIdSet.has(userSsoIdKey)) {
      throw new Error(`Legacy users contain duplicate ssoId "${userSsoIdKey}".`)
    }

    userIdSet.add(userIdKey)
    userSsoIdSet.add(userSsoIdKey)
  }

  for (const note of dump.notes) {
    const noteIdKey = note.id.toString()

    if (noteIdSet.has(noteIdKey)) {
      throw new Error(`Legacy notes contain duplicate id "${noteIdKey}".`)
    }

    if (note.sid.length > 64) {
      throw new Error(`Legacy note sid "${note.sid}" exceeds the current 64 character limit.`)
    }

    if (noteSidSet.has(note.sid)) {
      throw new Error(`Legacy notes contain duplicate sid "${note.sid}".`)
    }

    if (note.authorSsoId != null && !userSsoIdSet.has(note.authorSsoId.toString())) {
      throw new Error(
        `Legacy note "${note.id.toString()}" references missing author ssoId "${note.authorSsoId.toString()}".`
      )
    }

    noteIdSet.add(noteIdKey)
    noteSidSet.add(note.sid)
  }

  for (const relation of dump.noteOnUsers) {
    if (!noteIdSet.has(relation.noteId.toString())) {
      throw new Error(
        `Legacy noteonusers references missing noteId "${relation.noteId.toString()}".`
      )
    }

    if (!userSsoIdSet.has(relation.userSsoId.toString())) {
      throw new Error(
        `Legacy noteonusers references missing user ssoId "${relation.userSsoId.toString()}".`
      )
    }
  }
}

export async function loadLegacyMemoDump(inputPath: string) {
  const sql = await readFile(resolve(inputPath), 'utf8')
  const dump = parseLegacyMemoSqlDump(sql)
  validateLegacyMemoDump(dump)

  return dump
}

function normalizeCountValue(value: CountRow['total']) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  return Number.parseInt(value, 10)
}

async function readTargetTableCounts(prisma: PrismaClientLike | PrismaTransactionalClientLike) {
  const [users, notes, favorites] = await Promise.all([
    prisma.$queryRawUnsafe<CountRow[]>(targetTableCountSql.users),
    prisma.$queryRawUnsafe<CountRow[]>(targetTableCountSql.notes),
    prisma.$queryRawUnsafe<CountRow[]>(targetTableCountSql.favorites)
  ])

  return {
    users: normalizeCountValue(users[0]?.total ?? 0),
    notes: normalizeCountValue(notes[0]?.total ?? 0),
    favorites: normalizeCountValue(favorites[0]?.total ?? 0)
  }
}

async function assertEmptyTarget(prisma: PrismaClientLike) {
  const counts = await readTargetTableCounts(prisma)

  if (counts.users !== 0 || counts.notes !== 0 || counts.favorites !== 0) {
    throw new Error(
      `Target database is not empty (users=${counts.users}, notes=${counts.notes}, note_favorites=${counts.favorites}).`
    )
  }
}

async function clearTargetTables(prisma: PrismaClientLike) {
  await prisma.$executeRawUnsafe('DELETE FROM note_favorites')
  await prisma.$executeRawUnsafe('DELETE FROM notes')
  await prisma.$executeRawUnsafe('DELETE FROM users')
  await prisma.$executeRawUnsafe('ALTER TABLE users AUTO_INCREMENT = 1')
  await prisma.$executeRawUnsafe('ALTER TABLE notes AUTO_INCREMENT = 1')
}

async function insertLegacyUsers(
  rows: Array<Array<string | null>>,
  transactionClient: PrismaTransactionalClientLike
) {
  await executeBatchInsert(transactionClient, targetUserInsertSqlPrefix, rows)
}

async function executeBatchInsert(
  transactionClient: PrismaTransactionalClientLike,
  insertSqlPrefix: string,
  rows: Array<Array<string | null>>
) {
  if (rows.length === 0) {
    return
  }

  const columnCount = rows[0]?.length ?? 0

  for (let index = 0; index < rows.length; index += insertBatchSize) {
    const batchRows = rows.slice(index, index + insertBatchSize)
    const placeholders = batchRows
      .map(() => `(${new Array(columnCount).fill('?').join(', ')})`)
      .join(', ')
    const values = batchRows.flat()

    await transactionClient.$executeRawUnsafe(`${insertSqlPrefix} ${placeholders}`, ...values)
  }
}

function buildLegacyUserInsertRows(users: LegacyUserRecord[], importedAt: string) {
  return users.map((user) => [
    user.id.toString(),
    user.ssoId.toString(),
    importedAt,
    importedAt
  ])
}

async function buildLegacyNoteInsertRows(
  notes: LegacyNoteRecord[],
  userIdBySsoId: Map<string, bigint>,
  importedAt: string,
  editKeyService: NoteEditKeyService
) {
  let hashedKeyCount = 0
  const rows: Array<Array<string | null>> = []

  for (const note of notes) {
    let keyHash: string | null = null

    if (note.key != null && note.key !== '') {
      keyHash = await editKeyService.hashKey(note.key)
      hashedKeyCount += 1
    }

    const authorId =
      note.authorSsoId == null ? null : userIdBySsoId.get(note.authorSsoId.toString()) ?? null

    rows.push([
      note.id.toString(),
      note.sid,
      note.content,
      keyHash,
      authorId?.toString() ?? null,
      importedAt,
      importedAt,
      null
    ])
  }

  return {
    hashedKeyCount,
    rows
  }
}

function buildLegacyFavoriteInsertRows(
  relations: LegacyNoteOnUserRecord[],
  userIdBySsoId: Map<string, bigint>
) {
  return relations.map((relation) => {
    const mappedUserId = userIdBySsoId.get(relation.userSsoId.toString())

    if (!mappedUserId) {
      throw new Error(
        `Unable to map legacy favorite user ssoId "${relation.userSsoId.toString()}" to users.id.`
      )
    }

    return [relation.noteId.toString(), mappedUserId.toString(), relation.assignedAt]
  })
}

async function alignAutoIncrement(prisma: PrismaClientLike, tableName: 'users' | 'notes', nextId: bigint) {
  await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} AUTO_INCREMENT = ${nextId.toString()}`)
}

export async function migrateLegacyMemoDump(
  options: MigrateLegacyMemoDumpOptions
): Promise<LegacyMigrationSummary> {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient
  const prisma = await resolvePrismaClient()
  const editKeyService = options.editKeyService ?? createNoteEditKeyService()
  const importedAt = (options.importedAt ?? new Date()).toISOString().slice(0, 23).replace('T', ' ')
  const dump = await loadLegacyMemoDump(options.inputPath)
  const summary = summarizeLegacyMemoDump(dump)

  if (options.resetTarget) {
    await clearTargetTables(prisma)
  } else if (options.requireEmptyTarget ?? true) {
    await assertEmptyTarget(prisma)
  }

  const userIdBySsoId = new Map(dump.users.map((user) => [user.ssoId.toString(), user.id]))
  const userInsertRows = buildLegacyUserInsertRows(dump.users, importedAt)
  const { hashedKeyCount, rows: noteInsertRows } = await buildLegacyNoteInsertRows(
    dump.notes,
    userIdBySsoId,
    importedAt,
    editKeyService
  )
  const favoriteInsertRows = buildLegacyFavoriteInsertRows(dump.noteOnUsers, userIdBySsoId)

  await prisma.$transaction(async (transactionClient) => {
    await insertLegacyUsers(userInsertRows, transactionClient)
    await executeBatchInsert(transactionClient, targetNoteInsertSqlPrefix, noteInsertRows)
    await executeBatchInsert(transactionClient, targetFavoriteInsertSqlPrefix, favoriteInsertRows)
  })

  if (dump.users.length > 0) {
    const nextUserId = dump.users.reduce((maximumId, user) => {
      return user.id > maximumId ? user.id : maximumId
    }, 0n)

    await alignAutoIncrement(prisma, 'users', nextUserId + 1n)
  }

  if (dump.notes.length > 0) {
    const nextNoteId = dump.notes.reduce((maximumId, note) => {
      return note.id > maximumId ? note.id : maximumId
    }, 0n)

    await alignAutoIncrement(prisma, 'notes', nextNoteId + 1n)
  }

  const targetCounts = await readTargetTableCounts(prisma)

  return {
    ...summary,
    hashedKeyCount,
    targetUserCount: targetCounts.users,
    targetNoteCount: targetCounts.notes,
    targetFavoriteCount: targetCounts.favorites
  }
}
