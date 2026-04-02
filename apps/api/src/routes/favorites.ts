import type { FastifyPluginAsync } from 'fastify'

import { createModuleScopeMessage } from '../services/module-shell-service.js'

export const favoriteRoutes: FastifyPluginAsync = async (app) => {
  app.get('/shell-status', async () => ({
    module: 'favorites',
    scope: createModuleScopeMessage('favorites')
  }))
}
