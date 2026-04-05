import Fastify from 'fastify'

import type { NoteReadService } from './services/note-read-service.js'
import type { NoteWriteService } from './services/note-write-service.js'
import type { AppConfig } from './infra/config.js'
import type { AuthSessionService } from './services/auth-session-service.js'
import type { AuthSsoService } from './services/auth-sso-service.js'

import { authPlugin } from './plugins/auth.js'
import { cookiePlugin } from './plugins/cookies.js'
import { corsPlugin } from './plugins/cors.js'
import { authRoutes } from './routes/auth.js'
import { favoriteRoutes } from './routes/favorites.js'
import { healthRoutes } from './routes/health.js'
import { meRoutes } from './routes/me.js'
import { noteRoutes } from './routes/notes.js'

export interface BuildAppOptions {
  authSessionService?: AuthSessionService
  authSsoService?: AuthSsoService
  config?: AppConfig
  noteReadService?: NoteReadService
  noteWriteService?: NoteWriteService
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: false
  })

  app.register(cookiePlugin)
  app.register(corsPlugin)
  app.register(authPlugin, {
    authSessionService: options.authSessionService,
    authSsoService: options.authSsoService,
    config: options.config
  })
  app.register(healthRoutes)
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(noteRoutes, {
    prefix: '/api/notes',
    noteReadService: options.noteReadService,
    noteWriteService: options.noteWriteService
  })
  app.register(favoriteRoutes, { prefix: '/api/favorites' })
  app.register(meRoutes, { prefix: '/api/me' })

  return app
}
