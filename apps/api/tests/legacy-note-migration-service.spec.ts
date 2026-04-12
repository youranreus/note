import { describe, expect, it } from 'vitest'

import {
  parseLegacyMemoSqlDump,
  summarizeLegacyMemoDump,
  validateLegacyMemoDump
} from '../src/services/legacy-note-migration-service.js'

function createLegacyDumpSql(noteSid = 'sid-1') {
  return [
    'INSERT INTO `user` VALUES (1,26),(2,53);',
    `INSERT INTO \`note\` VALUES (1,'legacy-key','line1\\nit\\'s ready\\\\ok','${noteSid}',26),(2,NULL,'plain text','sid-2',NULL);`,
    "INSERT INTO `noteonusers` VALUES (1,53,'2024-02-21 08:58:26.945','26');"
  ].join('\n')
}

describe('legacy note migration service', () => {
  it('parses the legacy dump and decodes MySQL escaped strings', () => {
    const dump = parseLegacyMemoSqlDump(createLegacyDumpSql())

    expect(dump.users).toHaveLength(2)
    expect(dump.notes).toHaveLength(2)
    expect(dump.noteOnUsers).toHaveLength(1)

    expect(dump.notes[0]).toMatchObject({
      id: 1n,
      key: 'legacy-key',
      sid: 'sid-1',
      authorSsoId: 26n
    })
    expect(dump.notes[0]?.content).toBe("line1\nit's ready\\ok")
    expect(dump.noteOnUsers[0]).toMatchObject({
      noteId: 1n,
      userSsoId: 53n,
      assignedAt: '2024-02-21 08:58:26.945',
      assignedBy: '26'
    })
  })

  it('summarizes hashed legacy keys and validates compatible relations', () => {
    const dump = parseLegacyMemoSqlDump(createLegacyDumpSql())

    expect(() => validateLegacyMemoDump(dump)).not.toThrow()
    expect(summarizeLegacyMemoDump(dump)).toEqual({
      userCount: 2,
      noteCount: 2,
      noteOnUserCount: 1,
      hashedKeyCount: 1
    })
  })

  it('rejects duplicate sids that would violate the current schema', () => {
    const duplicateSidDump = parseLegacyMemoSqlDump(createLegacyDumpSql('sid-2'))

    expect(() => validateLegacyMemoDump(duplicateSidDump)).toThrow(/duplicate sid/u)
  })
})
