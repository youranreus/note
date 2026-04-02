import fastifyCookie from '@fastify/cookie'
import fp from 'fastify-plugin'

import type { FastifyInstance } from 'fastify'

async function registerCookies(app: FastifyInstance) {
  await app.register(fastifyCookie)
}

export const cookiePlugin = fp(registerCookies, {
  name: 'cookie-plugin'
})
