import type { FastifyPluginAsync } from 'fastify'

import { createModuleScopeMessage } from '../services/module-shell-service.js'

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/session', async (request) => {
    const session = app.authSessionService.getSession(request.cookies[app.authConfig.cookieName])

    if (!session) {
      return {
        status: 'anonymous'
      }
    }

    return session
  })

  app.get('/shell-status', async () => ({
    module: 'me',
    scope: createModuleScopeMessage('me')
  }))
}
