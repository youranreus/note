import type { FastifyPluginAsync } from 'fastify'

import { createModuleScopeMessage } from '../services/module-shell-service.js'

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/shell-status', async () => ({
    module: 'auth',
    scope: createModuleScopeMessage('auth')
  }))
}
