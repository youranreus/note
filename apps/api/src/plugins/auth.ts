import fp from 'fastify-plugin'

import type { FastifyInstance } from 'fastify'

import { resolveAppConfig, type AppConfig } from '../infra/config.js'
import {
  createAuthSessionService,
  type AuthSessionService
} from '../services/auth-session-service.js'
import { createAuthSsoService, type AuthSsoService } from '../services/auth-sso-service.js'

declare module 'fastify' {
  interface FastifyInstance {
    authConfig: AppConfig
    authSessionService: AuthSessionService
    authSsoService: AuthSsoService
  }
}

export interface AuthPluginOptions {
  config?: AppConfig
  authSessionService?: AuthSessionService
  authSsoService?: AuthSsoService
}

async function registerAuth(app: FastifyInstance, options: AuthPluginOptions) {
  const config = options.config ?? resolveAppConfig()

  app.decorate('authConfig', config)
  app.decorate(
    'authSessionService',
    options.authSessionService ?? createAuthSessionService(config)
  )
  app.decorate('authSsoService', options.authSsoService ?? createAuthSsoService(config))
}

export const authPlugin = fp(registerAuth, {
  name: 'auth-plugin'
})
