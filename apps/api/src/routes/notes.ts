import type { FastifyPluginAsync } from 'fastify'

import type { OnlineNoteSaveRequestDto } from '@note/shared-types'

import {
  noteDeleteErrorSchema,
  noteDeleteResponseSchema,
  noteDetailResponseSchema,
  noteReadErrorSchema,
  noteReadHeadersSchema,
  noteReadParamsSchema,
  noteWriteBodySchema,
  noteWriteErrorSchema,
  noteWriteResponseSchema
} from '../schemas/note.js'
import { createModuleScopeMessage } from '../services/module-shell-service.js'
import {
  NoteSidConflictError,
  createNoteReadService,
  type NoteReadService
} from '../services/note-read-service.js'
import { createNoteWriteService, type NoteWriteService } from '../services/note-write-service.js'

interface NoteRouteParams {
  sid: string
}

interface NoteReadHeaders {
  'x-note-edit-key'?: string | string[]
}

interface NoteRoutesOptions {
  noteReadService?: NoteReadService
  noteWriteService?: NoteWriteService
}

function resolveEditKey(rawEditKey: string | string[] | undefined) {
  return (Array.isArray(rawEditKey) ? rawEditKey[0] : rawEditKey)?.trim() || null
}

function createInvalidSidError(sid: string) {
  return {
    sid,
    code: 'INVALID_SID' as const,
    status: 'invalid-sid' as const,
    message: 'sid 不能为空白字符。'
  }
}

function createConflictError(sid: string) {
  return {
    sid,
    code: 'NOTE_SID_CONFLICT' as const,
    status: 'error' as const,
    message: '当前 sid 命中了多条记录，无法按唯一对象语义返回结果。'
  }
}

const noteShellStatusPath = '/__meta/shell-status'

export const noteRoutes: FastifyPluginAsync<NoteRoutesOptions> = async (app, options) => {
  const noteReadService = options.noteReadService ?? createNoteReadService()
  const noteWriteService = options.noteWriteService ?? createNoteWriteService()

  app.get(noteShellStatusPath, async () => ({
    module: 'notes',
    scope: createModuleScopeMessage('notes')
  }))

  app.get<{ Params: NoteRouteParams; Headers: NoteReadHeaders }>(
    '/:sid',
    {
      schema: {
        params: noteReadParamsSchema,
        headers: noteReadHeadersSchema,
        response: {
          200: noteDetailResponseSchema,
          400: noteReadErrorSchema,
          404: noteReadErrorSchema,
          409: noteReadErrorSchema
        }
      }
    },
    async (request, reply) => {
      const normalizedSid = request.params.sid.trim()

      if (normalizedSid === '') {
        return reply.status(400).send(createInvalidSidError(request.params.sid))
      }

      try {
        const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
        const result = await noteReadService.getBySid(
          normalizedSid,
          session,
          resolveEditKey(request.headers['x-note-edit-key'])
        )

        if (result.status === 'available') {
          return result.note
        }

        return reply.status(404).send(result.error)
      } catch (error) {
        if (error instanceof NoteSidConflictError) {
          return reply.status(409).send(createConflictError(error.sid))
        }

        throw error
      }
    }
  )

  app.put<{ Params: NoteRouteParams; Body: OnlineNoteSaveRequestDto }>(
    '/:sid',
    {
      schema: {
        params: noteReadParamsSchema,
        body: noteWriteBodySchema,
        response: {
          200: noteWriteResponseSchema,
          400: noteWriteErrorSchema,
          403: noteWriteErrorSchema,
          409: noteWriteErrorSchema
        }
      }
    },
    async (request, reply) => {
      const normalizedSid = request.params.sid.trim()

      if (normalizedSid === '') {
        return reply.status(400).send(createInvalidSidError(request.params.sid))
      }

      try {
        const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
        const result = await noteWriteService.saveBySid(normalizedSid, request.body, session)

        if (result.status === 'deleted') {
          return reply.status(409).send(result.error)
        }

        if (result.status === 'forbidden') {
          return reply.status(403).send(result.error)
        }

        if (result.status === 'created' || result.status === 'updated') {
          return result.note
        }

        throw new Error('Unhandled note write result.')
      } catch (error) {
        if (error instanceof NoteSidConflictError) {
          return reply.status(409).send(createConflictError(error.sid))
        }

        throw error
      }
    }
  )

  app.delete<{ Params: NoteRouteParams; Headers: NoteReadHeaders }>(
    '/:sid',
    {
      schema: {
        params: noteReadParamsSchema,
        headers: noteReadHeadersSchema,
        response: {
          200: noteDeleteResponseSchema,
          400: noteDeleteErrorSchema,
          403: noteDeleteErrorSchema,
          404: noteDeleteErrorSchema,
          409: noteDeleteErrorSchema
        }
      }
    },
    async (request, reply) => {
      const normalizedSid = request.params.sid.trim()

      if (normalizedSid === '') {
        return reply.status(400).send(createInvalidSidError(request.params.sid))
      }

      try {
        const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
        const result = await noteWriteService.deleteBySid(
          normalizedSid,
          resolveEditKey(request.headers['x-note-edit-key']),
          session
        )

        if (result.status === 'deleted') {
          return result.note
        }

        if (result.status === 'forbidden') {
          return reply.status(403).send(result.error)
        }

        if (result.status === 'not-found') {
          return reply.status(404).send(result.error)
        }

        if (result.status === 'already-deleted' || result.status === 'conflict') {
          return reply.status(409).send(result.error)
        }

        throw new Error('Unhandled note delete result.')
      } catch (error) {
        if (error instanceof NoteSidConflictError) {
          return reply.status(409).send(createConflictError(error.sid))
        }

        throw error
      }
    }
  )
}
