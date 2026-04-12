import { describe, expect, it } from 'vitest'

import { createNoteEditKeyService } from '../src/services/note-edit-key-service.js'

describe('note edit key service', () => {
  it('creates a non-plaintext hash and verifies the original key successfully', async () => {
    const service = createNoteEditKeyService()

    const hash = await service.hashKey('shared-secret')

    expect(hash).not.toContain('shared-secret')
    await expect(service.verifyKey('shared-secret', hash)).resolves.toBe(true)
    await expect(service.verifyKey('wrong-secret', hash)).resolves.toBe(false)
  })
})
