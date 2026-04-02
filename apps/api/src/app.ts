import Fastify from 'fastify'

import { cookiePlugin } from './plugins/cookies.js'
import { corsPlugin } from './plugins/cors.js'
import { authRoutes } from './routes/auth.js'
import { favoriteRoutes } from './routes/favorites.js'
import { healthRoutes } from './routes/health.js'
import { meRoutes } from './routes/me.js'
import { noteRoutes } from './routes/notes.js'

export function buildApp() {
  const app = Fastify({
    logger: false
  })

  app.register(cookiePlugin)
  app.register(corsPlugin)
  app.register(healthRoutes)
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(noteRoutes, { prefix: '/api/notes' })
  app.register(favoriteRoutes, { prefix: '/api/favorites' })
  app.register(meRoutes, { prefix: '/api/me' })

  return app
}
