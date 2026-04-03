import Fastify from 'fastify'

import type { NoteReadService } from './services/note-read-service.js'
import type { NoteWriteService } from './services/note-write-service.js'

import { cookiePlugin } from './plugins/cookies.js'
import { corsPlugin } from './plugins/cors.js'
import { authRoutes } from './routes/auth.js'
import { favoriteRoutes } from './routes/favorites.js'
import { healthRoutes } from './routes/health.js'
import { meRoutes } from './routes/me.js'
import { noteRoutes } from './routes/notes.js'

export interface BuildAppOptions {
  noteReadService?: NoteReadService
  noteWriteService?: NoteWriteService
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: false
  })

  app.register(cookiePlugin)
  app.register(corsPlugin)
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
