import type { FastifyPluginAsync } from 'fastify'

import { createModuleScopeMessage } from '../services/module-shell-service.js'

export const noteRoutes: FastifyPluginAsync = async (app) => {
  app.get('/shell-status', async () => ({
    module: 'notes',
    scope: createModuleScopeMessage('notes')
  }))
}
