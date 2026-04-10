import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'
import { createAuthSessionService } from '../src/services/auth-session-service.js'
import { NoteSidConflictError, type NoteReadService, type NoteReadServiceResult } from '../src/services/note-read-service.js'
import type { NoteWriteService, NoteWriteServiceResult } from '../src/services/note-write-service.js'

interface StoredNote {
  sid: string
  content: string
  deleted?: boolean
  authorSessionId?: string
  editKey?: string
}

function createFakeNoteServices(seedNotes: StoredNote[] = []) {
  const store = new Map(seedNotes.map((note) => [note.sid, note]))

  const noteReadService: NoteReadService = {
    async getBySid(sid: string, session, editKey): Promise<NoteReadServiceResult> {
      const note = store.get(sid)

      if (!note) {
        return {
          status: 'not-found',
          error: {
            sid,
            code: 'NOTE_NOT_FOUND',
            status: 'not-found',
            message: '未找到与当前 sid 对应的在线便签。'
          }
        }
      }

      if (note.deleted) {
        return {
          status: 'deleted',
          error: {
            sid,
            code: 'NOTE_DELETED',
            status: 'deleted',
            message: '该在线便签已删除，当前链接不可继续读取。'
          }
        }
      }

      return {
        status: 'available',
        note: {
          sid,
          content: note.content,
          status: 'available',
          favoriteState:
            note.authorSessionId && note.authorSessionId === session?.user.id
              ? 'self-owned'
              : 'not-favorited',
          editAccess:
            note.authorSessionId && note.authorSessionId !== session?.user.id
              ? note.editKey
                ? editKey === note.editKey
                  ? 'key-editable'
                  : 'key-required'
                : 'forbidden'
              : note.authorSessionId
                ? 'owner-editable'
                : note.editKey
                ? editKey === note.editKey
                  ? 'key-editable'
                  : 'key-required'
                : 'anonymous-editable'
        }
      }
    }
  }

  const noteWriteService: NoteWriteService = {
    async saveBySid(sid: string, input, session): Promise<NoteWriteServiceResult> {
      if (sid === 'conflict123') {
        throw new NoteSidConflictError(sid)
      }

      const existing = store.get(sid)

      if (existing?.deleted) {
        return {
          status: 'deleted',
          error: {
            sid,
            code: 'NOTE_DELETED',
            status: 'deleted',
            message: '该在线便签已删除，当前链接不可继续写入。'
          }
        }
      }

      if (!existing) {
        store.set(sid, {
          sid,
          content: input.content,
          authorSessionId: session?.user.id,
          editKey: input.editKeyAction === 'set' ? input.editKey : undefined
        })

        return {
          status: 'created',
          note: {
            sid,
            content: input.content,
            status: 'available',
            favoriteState: session ? 'self-owned' : 'not-favorited',
            editAccess: input.editKeyAction === 'set'
              ? session
                ? 'owner-editable'
                : 'key-editable'
              : session
                ? 'owner-editable'
                : 'anonymous-editable',
            saveResult: 'created'
          }
        }
      }

      const isOwner = existing.authorSessionId
        ? existing.authorSessionId === session?.user.id
        : false

      if (existing.authorSessionId && !isOwner && !existing.editKey) {
        return {
          status: 'forbidden',
          error: {
            sid,
            code: 'NOTE_FORBIDDEN',
            status: 'forbidden',
            message: '当前账户不能修改这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
          }
        }
      }

      if (existing.editKey) {
        if (input.editKeyAction !== 'use' || !input.editKey) {
          return {
            status: 'forbidden',
            error: {
              sid,
              code: 'NOTE_EDIT_KEY_REQUIRED',
              status: 'forbidden',
              message: '当前对象需要输入编辑密钥后才能保存更新。'
            }
          }
        }

        if (input.editKey !== existing.editKey) {
          return {
            status: 'forbidden',
            error: {
              sid,
              code: 'NOTE_EDIT_KEY_INVALID',
              status: 'forbidden',
              message: '当前编辑密钥不正确，请确认后重试。'
            }
          }
        }

        existing.content = input.content

        return {
          status: 'updated',
          note: {
            sid,
            content: input.content,
            status: 'available',
            favoriteState: isOwner ? 'self-owned' : 'not-favorited',
            editAccess: isOwner ? 'owner-editable' : 'key-editable',
            saveResult: 'updated'
          }
        }
      }

      existing.content = input.content

      return {
        status: 'updated',
        note: {
          sid,
          content: input.content,
          status: 'available',
          favoriteState: existing.authorSessionId ? 'self-owned' : 'not-favorited',
          editAccess: existing.authorSessionId ? 'owner-editable' : 'anonymous-editable',
          saveResult: 'updated'
        }
      }
    }
    ,
    async deleteBySid(sid: string, editKey, session) {
      if (sid === 'conflict123') {
        throw new NoteSidConflictError(sid)
      }

      const existing = store.get(sid)

      if (!existing) {
        return {
          status: 'not-found',
          error: {
            sid,
            code: 'NOTE_NOT_FOUND',
            status: 'not-found',
            message: '未找到与当前 sid 对应的在线便签。'
          }
        }
      }

      if (existing.deleted) {
        return {
          status: 'already-deleted',
          error: {
            sid,
            code: 'NOTE_DELETED',
            status: 'deleted',
            message: '该在线便签已删除，当前链接不可继续删除。'
          }
        }
      }

      const isOwner = existing.authorSessionId
        ? existing.authorSessionId === session?.user.id
        : false

      if (existing.authorSessionId && !isOwner && !existing.editKey) {
        return {
          status: 'forbidden',
          error: {
            sid,
            code: 'NOTE_FORBIDDEN',
            status: 'forbidden',
            message: '当前账户不能删除这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
          }
        }
      }

      if (existing.editKey) {
        if (!editKey?.trim()) {
          return {
            status: 'forbidden',
            error: {
              sid,
              code: 'NOTE_EDIT_KEY_REQUIRED',
              status: 'forbidden',
              message: '当前对象需要输入编辑密钥后才能删除。'
            }
          }
        }

        if (editKey.trim() !== existing.editKey) {
          return {
            status: 'forbidden',
            error: {
              sid,
              code: 'NOTE_EDIT_KEY_INVALID',
              status: 'forbidden',
              message: '当前编辑密钥不正确，请确认后重试。'
            }
          }
        }
      }

      existing.deleted = true

      return {
        status: 'deleted',
        note: {
          sid,
          status: 'deleted',
          message: '该在线便签已删除，当前链接不可恢复。'
        }
      }
    }
  }

  return {
    noteReadService,
    noteWriteService
  }
}

describe('notes write endpoint', () => {
  const authSessionService = createAuthSessionService({
    sessionTtlSeconds: 600
  })
  const ownerCookie = `sid=${authSessionService.createSession({
    id: '1001',
    displayName: 'Owner'
  })}`
  const otherCookie = `sid=${authSessionService.createSession({
    id: '2002',
    displayName: 'Other User'
  })}`

  it('creates a new note on the first PUT and keeps it readable through GET', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const putResponse = await app.inject({
        method: 'PUT',
        url: '/api/notes/new123',
        payload: {
          content: '第一次保存的正文。'
        }
      })

      expect(putResponse.statusCode).toBe(200)
      expect(putResponse.json()).toEqual({
        sid: 'new123',
        content: '第一次保存的正文。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited',
        saveResult: 'created'
      })

      const getResponse = await app.inject({
        method: 'GET',
        url: '/api/notes/new123'
      })

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.json()).toEqual({
        sid: 'new123',
        content: '第一次保存的正文。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited'
      })
    } finally {
      await app.close()
    }
  })

  it('updates an existing note in place and keeps the sid stable', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'existing123',
          content: '旧内容。'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/existing123',
        payload: {
          content: '更新后的最新内容。'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'existing123',
        content: '更新后的最新内容。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited',
        saveResult: 'updated'
      })

      const getResponse = await app.inject({
        method: 'GET',
        url: '/api/notes/existing123'
      })

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.json()).toEqual({
        sid: 'existing123',
        content: '更新后的最新内容。',
        status: 'available',
        editAccess: 'anonymous-editable',
        favoriteState: 'not-favorited'
      })
    } finally {
      await app.close()
    }
  })

  it('creates a keyed note when the first save explicitly sets an edit key', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/keyed123',
        payload: {
          content: '带密钥的正文。',
          editKey: 'shared-secret',
          editKeyAction: 'set'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'keyed123',
        content: '带密钥的正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited',
        saveResult: 'created'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_EDIT_KEY_REQUIRED when updating a keyed note without a key', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'keyed123',
          content: '旧正文。',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/keyed123',
        payload: {
          content: '新正文。'
        }
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toEqual({
        sid: 'keyed123',
        code: 'NOTE_EDIT_KEY_REQUIRED',
        status: 'forbidden',
        message: '当前对象需要输入编辑密钥后才能保存更新。'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_EDIT_KEY_INVALID when the provided key is wrong', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'keyed123',
          content: '旧正文。',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/keyed123',
        payload: {
          content: '新正文。',
          editKey: 'wrong-secret',
          editKeyAction: 'use'
        }
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toEqual({
        sid: 'keyed123',
        code: 'NOTE_EDIT_KEY_INVALID',
        status: 'forbidden',
        message: '当前编辑密钥不正确，请确认后重试。'
      })
    } finally {
      await app.close()
    }
  })

  it('lets a non-owner collaborator update an owner-bound keyed note with the correct key', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'owner-keyed123',
          content: '创建者 + 密钥保护的旧正文。',
          authorSessionId: '1001',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/owner-keyed123',
        headers: {
          cookie: otherCookie
        },
        payload: {
          content: '协作者更新后的正文。',
          editKey: 'shared-secret',
          editKeyAction: 'use'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'owner-keyed123',
        content: '协作者更新后的正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited',
        saveResult: 'updated'
      })

      const getResponse = await app.inject({
        method: 'GET',
        url: '/api/notes/owner-keyed123',
        headers: {
          cookie: otherCookie,
          'x-note-edit-key': 'shared-secret'
        }
      })

      expect(getResponse.statusCode).toBe(200)
      expect(getResponse.json()).toEqual({
        sid: 'owner-keyed123',
        content: '协作者更新后的正文。',
        status: 'available',
        editAccess: 'key-editable',
        favoriteState: 'not-favorited'
      })
    } finally {
      await app.close()
    }
  })

  it('rejects blank sid params for PUT just like the read endpoint', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/%20%20',
        payload: {
          content: '不会被写入。'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        code: 'INVALID_SID',
        status: 'invalid-sid'
      })
    } finally {
      await app.close()
    }
  })

  it('returns a stable conflict payload when duplicate sid risk is detected', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/conflict123',
        payload: {
          content: '发生冲突时不应静默覆盖。'
        }
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toMatchObject({
        sid: 'conflict123',
        code: 'NOTE_SID_CONFLICT',
        status: 'error'
      })
    } finally {
      await app.close()
    }
  })

  it('does not revive deleted notes through the save endpoint', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'deleted123',
          content: '已删除内容。',
          deleted: true
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/deleted123',
        payload: {
          content: '试图复活的内容。'
        }
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toMatchObject({
        sid: 'deleted123',
        code: 'NOTE_DELETED',
        status: 'deleted'
      })
    } finally {
      await app.close()
    }
  })

  it('binds an authenticated creator as the default editor on first save', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/owner123',
        headers: {
          cookie: ownerCookie
        },
        payload: {
          content: '创建者的第一版内容。'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'owner123',
        content: '创建者的第一版内容。',
        status: 'available',
        editAccess: 'owner-editable',
        favoriteState: 'self-owned',
        saveResult: 'created'
      })
    } finally {
      await app.close()
    }
  })

  it('rejects updates from a different authenticated session for owner-bound notes', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'owner123',
          content: '创建者原始正文。',
          authorSessionId: '1001'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/notes/owner123',
        headers: {
          cookie: otherCookie
        },
        payload: {
          content: '非创建者试图覆盖。'
        }
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({
        sid: 'owner123',
        code: 'NOTE_FORBIDDEN',
        status: 'forbidden'
      })
    } finally {
      await app.close()
    }
  })

  it('deletes an owner-bound note after confirmation and returns a deleted terminal payload', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'owner123',
          content: '创建者原始正文。',
          authorSessionId: '1001'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/owner123',
        headers: {
          cookie: ownerCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'owner123',
        status: 'deleted',
        message: '该在线便签已删除，当前链接不可恢复。'
      })
    } finally {
      await app.close()
    }
  })

  it('lets a non-owner collaborator delete an owner-bound keyed note with the correct edit key', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'keyed123',
          content: '带密钥的正文。',
          authorSessionId: '1001',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/keyed123',
        headers: {
          cookie: otherCookie,
          'x-note-edit-key': 'shared-secret'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        sid: 'keyed123',
        status: 'deleted',
        message: '该在线便签已删除，当前链接不可恢复。'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_FORBIDDEN instead of a generic error when another session tries to delete an owner-bound note', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'owner123',
          content: '创建者原始正文。',
          authorSessionId: '1001'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/owner123',
        headers: {
          cookie: otherCookie
        }
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({
        sid: 'owner123',
        code: 'NOTE_FORBIDDEN',
        status: 'forbidden',
        message: '当前账户不能删除这条已绑定创建者的在线便签，请使用创建者身份重新登录后再试。'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_EDIT_KEY_REQUIRED when a keyed note is deleted without providing the current edit key', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'keyed123',
          content: '带密钥的正文。',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/keyed123'
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({
        sid: 'keyed123',
        code: 'NOTE_EDIT_KEY_REQUIRED',
        status: 'forbidden'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_EDIT_KEY_INVALID when a keyed note is deleted with the wrong edit key', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'keyed123',
          content: '带密钥的正文。',
          editKey: 'shared-secret'
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/keyed123',
        headers: {
          'x-note-edit-key': 'wrong-secret'
        }
      })

      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({
        sid: 'keyed123',
        code: 'NOTE_EDIT_KEY_INVALID',
        status: 'forbidden'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_NOT_FOUND when delete targets a sid that does not exist', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/missing123'
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toMatchObject({
        sid: 'missing123',
        code: 'NOTE_NOT_FOUND',
        status: 'not-found'
      })
    } finally {
      await app.close()
    }
  })

  it('returns NOTE_DELETED when delete targets a note that is already deleted', async () => {
    const app = buildApp({
      ...createFakeNoteServices([
        {
          sid: 'deleted123',
          content: '已删除的正文。',
          deleted: true
        }
      ]),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/deleted123'
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toMatchObject({
        sid: 'deleted123',
        code: 'NOTE_DELETED',
        status: 'deleted'
      })
    } finally {
      await app.close()
    }
  })

  it('rejects blank sid params for DELETE just like the read and save endpoints', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/%20%20'
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        code: 'INVALID_SID',
        status: 'invalid-sid'
      })
    } finally {
      await app.close()
    }
  })

  it('returns a stable conflict payload when delete detects duplicate sid risk', async () => {
    const app = buildApp({
      ...createFakeNoteServices(),
      authSessionService
    })

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notes/conflict123'
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toMatchObject({
        sid: 'conflict123',
        code: 'NOTE_SID_CONFLICT',
        status: 'error'
      })
    } finally {
      await app.close()
    }
  })
})
