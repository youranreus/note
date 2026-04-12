import type { FastifyPluginAsync } from 'fastify'

import { createHealthPayload } from '../infra/config.js'
import { healthResponseSchema } from '../schemas/health.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: healthResponseSchema
        }
      }
    },
    async () => createHealthPayload()
  )
}
