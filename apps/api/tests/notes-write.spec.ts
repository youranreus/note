import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'
import { NoteSidConflictError, type NoteReadService, type NoteReadServiceResult } from '../src/services/note-read-service.js'
import type { NoteWriteService, NoteWriteServiceResult } from '../src/services/note-write-service.js'

interface StoredNote {
  sid: string
  content: string
  deleted?: boolean
}

function createFakeNoteServices(seedNotes: StoredNote[] = []) {
  const store = new Map(seedNotes.map((note) => [note.sid, note]))

  const noteReadService: NoteReadService = {
    async getBySid(sid: string): Promise<NoteReadServiceResult> {
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
          status: 'available'
        }
      }
    }
  }

  const noteWriteService: NoteWriteService = {
    async saveBySid(sid: string, input): Promise<NoteWriteServiceResult> {
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
          content: input.content
        })

        return {
          status: 'created',
          note: {
            sid,
            content: input.content,
            status: 'available',
            saveResult: 'created'
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
          saveResult: 'updated'
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
  it('creates a new note on the first PUT and keeps it readable through GET', async () => {
    const app = buildApp(createFakeNoteServices())

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
        status: 'available'
      })
    } finally {
      await app.close()
    }
  })

  it('updates an existing note in place and keeps the sid stable', async () => {
    const app = buildApp(
      createFakeNoteServices([
        {
          sid: 'existing123',
          content: '旧内容。'
        }
      ])
    )

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
        status: 'available'
      })
    } finally {
      await app.close()
    }
  })

  it('rejects blank sid params for PUT just like the read endpoint', async () => {
    const app = buildApp(createFakeNoteServices())

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
    const app = buildApp(createFakeNoteServices())

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
    const app = buildApp(
      createFakeNoteServices([
        {
          sid: 'deleted123',
          content: '已删除内容。',
          deleted: true
        }
      ])
    )

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
})
