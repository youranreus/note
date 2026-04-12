import fastifyCors from '@fastify/cors'
import fp from 'fastify-plugin'

import type { FastifyInstance } from 'fastify'

import { resolveAppConfig } from '../infra/config.js'

async function registerCors(app: FastifyInstance) {
  const config = resolveAppConfig()

  await app.register(fastifyCors, {
    origin: config.webOrigin,
    credentials: true
  })
}

export const corsPlugin = fp(registerCors, {
  name: 'cors-plugin'
})
