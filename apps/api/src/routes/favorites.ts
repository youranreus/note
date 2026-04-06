import type { FastifyPluginAsync } from 'fastify'

import type { FavoriteRequestDto } from '@note/shared-types'

import {
  favoriteBodySchema,
  favoriteErrorSchema,
  favoriteResponseSchema
} from '../schemas/favorite.js'
import { createModuleScopeMessage } from '../services/module-shell-service.js'
import { createFavoriteService, type FavoriteService } from '../services/favorite-service.js'

interface FavoriteRoutesOptions {
  favoriteService?: FavoriteService
}

export const favoriteRoutes: FastifyPluginAsync<FavoriteRoutesOptions> = async (app, options) => {
  const favoriteService = options.favoriteService ?? createFavoriteService()

  app.post<{ Body: FavoriteRequestDto }>(
    '/',
    {
      schema: {
        body: favoriteBodySchema,
        response: {
          200: favoriteResponseSchema,
          401: favoriteErrorSchema,
          403: favoriteErrorSchema,
          404: favoriteErrorSchema,
          409: favoriteErrorSchema
        }
      }
    },
    async (request, reply) => {
      const normalizedSid = request.body.sid.trim()
      const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])
      const result = await favoriteService.favoriteBySid(normalizedSid, session)

      if (result.status === 'favorited') {
        return result.favorite
      }

      if (result.status === 'unauthorized') {
        return reply.status(401).send(result.error)
      }

      if (result.status === 'not-found' || result.status === 'deleted') {
        return reply.status(404).send(result.error)
      }

      if (result.status === 'forbidden') {
        return reply.status(403).send(result.error)
      }

      return reply.status(409).send(result.error)
    }
  )

  app.get('/shell-status', async () => ({
    module: 'favorites',
    scope: createModuleScopeMessage('favorites')
  }))
}
