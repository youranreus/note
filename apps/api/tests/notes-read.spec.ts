import { afterAll, describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'
import type {
  NoteReadService,
  NoteReadServiceResult
} from '../src/services/note-read-service.js'
import { createAuthSessionService } from '../src/services/auth-session-service.js'

function createFakeNoteReadService(): NoteReadService {
  return {
    async getBySid(sid: string, session): Promise<NoteReadServiceResult> {
      if (sid === 'readable123' || sid === 'shell-status') {
        return {
          status: 'available',
          note: {
            sid,
            content: sid === 'shell-status' ? '保留字 sid 也应命中真实对象。' : '这是最新已保存内容。',
            status: 'available',
            editAccess: 'anonymous-editable'
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
            editAccess: session?.user.id === '1001' ? 'owner-editable' : 'forbidden'
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
      editAccess: 'anonymous-editable'
    })
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
      editAccess: 'anonymous-editable'
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
      editAccess: 'forbidden'
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
      editAccess: 'owner-editable'
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
