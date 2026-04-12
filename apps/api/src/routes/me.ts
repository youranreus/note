import type { FastifyPluginAsync } from 'fastify'

import type { MyNotesQueryDto } from '@note/shared-types'

import { createModuleScopeMessage } from '../services/module-shell-service.js'
import {
  meErrorSchema,
  myFavoritesResponseSchema,
  myNotesQuerySchema,
  myNotesResponseSchema
} from '../schemas/me.js'
import { createMeService, type MeService } from '../services/me-service.js'

interface MeRoutesOptions {
  meService?: MeService
}

export const meRoutes: FastifyPluginAsync<MeRoutesOptions> = async (app, options) => {
  const meService = options.meService ?? createMeService()

  app.get('/session', async (request) => {
    const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])

    if (!session) {
      return {
        status: 'anonymous'
      }
    }

    return session
  })

  app.get<{ Querystring: MyNotesQueryDto }>(
    '/notes',
    {
      schema: {
        querystring: myNotesQuerySchema,
        response: {
          200: myNotesResponseSchema,
          401: meErrorSchema
        }
      }
    },
    async (request, reply) => {
      const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
      const result = await meService.getMyNotes(request.query, session)

      if (result.status === 'unauthorized') {
        return reply.status(401).send(result.error)
      }

      return result.response
    }
  )

  app.get<{ Querystring: MyNotesQueryDto }>(
    '/favorites',
    {
      schema: {
        querystring: myNotesQuerySchema,
        response: {
          200: myFavoritesResponseSchema,
          401: meErrorSchema
        }
      }
    },
    async (request, reply) => {
      const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
      const result = await meService.getMyFavorites(request.query, session)

      if (result.status === 'unauthorized') {
        return reply.status(401).send(result.error)
      }

      return result.response
    }
  )

  app.get('/shell-status', async () => ({
    module: 'me',
    scope: createModuleScopeMessage('me')
  }))
}
