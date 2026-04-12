import { describe, expect, it } from 'vitest'

import type { AuthenticatedSessionDto } from '@note/shared-types'

import { createNoteReadService, type NoteReadRepository } from '../src/services/note-read-service.js'

function createSession(userId = '1001'): AuthenticatedSessionDto {
  return {
    status: 'authenticated',
    user: {
      id: userId,
      ssoId: userId,
      displayName: 'Demo User',
      avatarUrl: null
    }
  }
}

describe('note read service', () => {
  it('returns key-editable when the caller supplies the correct edit key for a keyed note', async () => {
    const repository: NoteReadRepository = {
      async findBySid() {
        return [
          {
            id: 1,
            sid: 'shared123',
            content: '需要密钥的正文。',
            authorId: null,
            keyHash: 'hashed-key',
            deletedAt: null
          }
        ]
      }
    }
    const service = createNoteReadService(
      repository,
      {
        async ensureBySsoId() {
          throw new Error('read service should not call ensureBySsoId')
        },
        async findBySsoId() {
          return null
        }
      },
      {
        async hashKey() {
          throw new Error('read service should not hash keys')
        },
        async verifyKey(key, storedHash) {
          return key === 'shared-secret' && storedHash === 'hashed-key'
        }
      }
    )

    await expect(service.getBySid('shared123', null, 'shared-secret')).resolves.toEqual({
      status: 'available',
      note: {
        sid: 'shared123',
        content: '需要密钥的正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited'
      }
    })
  })

  it('reports key-required for anonymous keyed notes while keeping them readable', async () => {
    const repository: NoteReadRepository = {
      async findBySid() {
        return [
          {
            id: 1,
            sid: 'shared123',
            content: '需要密钥的正文。',
            authorId: null,
            keyHash: 'hashed-key',
            deletedAt: null
          }
        ]
      }
    }
    const service = createNoteReadService(repository)

    await expect(service.getBySid('shared123', null)).resolves.toEqual({
      status: 'available',
      note: {
        sid: 'shared123',
        content: '需要密钥的正文。',
        status: 'available',
        editAccess: 'key-required',
        favoriteState: 'not-favorited'
      }
    })
  })

  it('reports key-required for non-owner sessions when the owner has enabled shared edit key', async () => {
    const repository: NoteReadRepository = {
      async findBySid() {
        return [
          {
            id: 1,
            sid: 'owner-keyed',
            content: '创建者正文。',
            authorId: 7,
            keyHash: 'hashed-key',
            deletedAt: null
          }
        ]
      }
    }
    const service = createNoteReadService(repository, {
      async ensureBySsoId() {
        throw new Error('read service should not call ensureBySsoId')
      },
      async findBySsoId() {
        return {
          id: 9,
          ssoId: 2002
        }
      }
    }, undefined, {
      async isFavoritedByUser() {
        return false
      }
    })

    await expect(service.getBySid('owner-keyed', createSession('2002'))).resolves.toEqual({
      status: 'available',
      note: {
        sid: 'owner-keyed',
        content: '创建者正文。',
        status: 'available',
        editAccess: 'key-required',
        favoriteState: 'not-favorited'
      }
    })
  })

  it('reuses the resolved user mapping for favorite state instead of querying from session id twice', async () => {
    const repository: NoteReadRepository = {
      async findBySid() {
        return [
          {
            id: 42,
            sid: 'shared123',
            content: '共享正文。',
            authorId: 7,
            keyHash: 'hashed-key',
            deletedAt: null
          }
        ]
      }
    }
    let lookupCount = 0
    const service = createNoteReadService(
      repository,
      {
        async ensureBySsoId() {
          throw new Error('read service should not call ensureBySsoId')
        },
        async findBySsoId() {
          lookupCount += 1

          if (lookupCount > 1) {
            throw new Error('findBySsoId should not be called twice for a single read')
          }

          return {
            id: 9,
            ssoId: 2002
          }
        }
      },
      undefined,
      {
        async isFavoritedByUser(noteId, userId) {
          expect(noteId).toBe(42)
          expect(userId).toBe(9)
          return true
        }
      }
    )

    await expect(service.getBySid('shared123', createSession('2002'))).resolves.toEqual({
      status: 'available',
      note: {
        sid: 'shared123',
        content: '共享正文。',
        status: 'available',
        editAccess: 'key-required',
        favoriteState: 'favorited'
      }
    })
    expect(lookupCount).toBe(1)
  })

  it('returns a deleted contract without leaking the stored content when the matched note is soft-deleted', async () => {
    const repository: NoteReadRepository = {
      async findBySid() {
        return [
          {
            id: 1,
            sid: 'deleted123',
            content: '这段已删除正文不应继续返回给调用方。',
            authorId: null,
            keyHash: null,
            deletedAt: new Date('2026-04-10T08:00:00.000Z')
          }
        ]
      }
    }
    const service = createNoteReadService(repository)

    await expect(service.getBySid('deleted123', null)).resolves.toEqual({
      status: 'deleted',
      error: {
        sid: 'deleted123',
        code: 'NOTE_DELETED',
        status: 'deleted',
        message: '该在线便签已删除，当前链接不可继续读取。'
      }
    })
  })
})
