import type { FastifyPluginAsync } from 'fastify'

import { createModuleScopeMessage } from '../services/module-shell-service.js'

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/shell-status', async () => ({
    module: 'me',
    scope: createModuleScopeMessage('me')
  }))
}
