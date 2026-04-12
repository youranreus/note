import { afterAll, describe, expect, it, vi } from 'vitest'

import { buildApp } from '../src/app.js'
import type {
  NoteReadService,
  NoteReadServiceResult
} from '../src/services/note-read-service.js'
import { createAuthSessionService } from '../src/services/auth-session-service.js'

function createFakeNoteReadService(): NoteReadService {
  return {
    async getBySid(sid: string, session, editKey): Promise<NoteReadServiceResult> {
      if (sid === 'readable123' || sid === 'shell-status') {
        return {
          status: 'available',
          note: {
            sid,
            content: sid === 'shell-status' ? '保留字 sid 也应命中真实对象。' : '这是最新已保存内容。',
            status: 'available',
            editAccess: 'anonymous-editable',
            favoriteState: 'not-favorited'
          }
        }
      }

      if (sid === 'owner123') {
        return {
          status: 'available',
          note: {
            sid,
            content: '创建者的正文。',
            status: 'available',
            editAccess: session?.user.id === '1001' ? 'owner-editable' : 'forbidden',
            favoriteState: session?.user.id === '1001' ? 'self-owned' : 'not-favorited'
          }
        }
      }

      if (sid === 'keyed123') {
        return {
          status: 'available',
          note: {
            sid,
            content: '需要密钥的正文。',
            status: 'available',
            editAccess: editKey === 'shared-secret' ? 'key-editable' : 'key-required',
            favoriteState: 'not-favorited'
          }
        }
      }

      if (sid === 'owner-keyed123') {
        return {
          status: 'available',
          note: {
            sid,
            content: '创建者 + 密钥保护的正文。',
            status: 'available',
            editAccess: session?.user.id === '1001' ? 'owner-editable' : 'key-required',
            favoriteState: session?.user.id === '1001' ? 'self-owned' : 'not-favorited'
          }
        }
      }

      if (sid === 'deleted123') {
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
        status: 'not-found',
        error: {
          sid,
          code: 'NOTE_NOT_FOUND',
          status: 'not-found',
          message: '未找到与当前 sid 对应的在线便签。'
        }
      }
    }
  }
}

describe('notes read endpoint', () => {
  const authSessionService = createAuthSessionService({
    sessionTtlSeconds: 600
  })
  const ownerSessionCookie = `sid=${authSessionService.createSession({
    id: '1001',
    displayName: 'Owner'
  })}`
  const app = buildApp({
    noteReadService: createFakeNoteReadService(),
    authSessionService
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns the latest content for a readable sid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/readable123'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'readable123',
      content: '这是最新已保存内容。',
      status: 'available',
      editAccess: 'anonymous-editable',
      favoriteState: 'not-favorited'
    })
  })

  it('logs note reads with sid and outcome when a note is returned', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notes/readable123'
      })

      expect(response.statusCode).toBe(200)
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('匿名用户读取了便签(rea...123)，读取成功，编辑权限为 anonymous-editable。')
      )
    } finally {
      consoleInfo.mockRestore()
    }
  })

  it('returns a stable not-found payload when no note matches the sid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/missing123'
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      sid: 'missing123',
      code: 'NOTE_NOT_FOUND',
      status: 'not-found'
    })
  })

  it('returns a deleted payload when the matched note is no longer readable', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/deleted123'
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      sid: 'deleted123',
      code: 'NOTE_DELETED',
      status: 'deleted'
    })
    expect(response.json()).not.toHaveProperty('content')
  })

  it('treats shell-status as a normal sid instead of routing it to the module shell', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/shell-status'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'shell-status',
      content: '保留字 sid 也应命中真实对象。',
      status: 'available',
      editAccess: 'anonymous-editable',
      favoriteState: 'not-favorited'
    })
  })

  it('keeps owner-bound notes readable for anonymous viewers but reports forbidden edit access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/owner123'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'owner123',
      content: '创建者的正文。',
      status: 'available',
      editAccess: 'forbidden',
      favoriteState: 'not-favorited'
    })
  })

  it('returns owner-editable access when the current session matches the note owner', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/owner123',
      headers: {
        cookie: ownerSessionCookie
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'owner123',
      content: '创建者的正文。',
      status: 'available',
      editAccess: 'owner-editable',
      favoriteState: 'self-owned'
    })
  })

  it('keeps keyed notes readable but reports key-required access for anonymous viewers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/keyed123'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'keyed123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-required',
      favoriteState: 'not-favorited'
    })
  })

  it('returns key-editable when the caller reads a keyed note with the current edit key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/keyed123',
      headers: {
        'x-note-edit-key': 'shared-secret'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'keyed123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-editable',
      favoriteState: 'not-favorited'
    })
  })

  it('keeps keyed owner-bound notes owner-editable for the matching session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/owner-keyed123',
      headers: {
        cookie: ownerSessionCookie
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sid: 'owner-keyed123',
      content: '创建者 + 密钥保护的正文。',
      status: 'available',
      editAccess: 'owner-editable',
      favoriteState: 'self-owned'
    })
  })

  it('keeps the notes module shell endpoint available on the dedicated meta path', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/__meta/shell-status'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      module: 'notes',
      scope: 'notes module shell is reserved for future stories.'
    })
  })

  it('rejects blank sid params instead of coercing them into a fake object id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes/%20%20'
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'INVALID_SID',
      status: 'invalid-sid'
    })
  })
})
