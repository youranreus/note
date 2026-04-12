import { buildApp } from './app.js'
import { resolveAppConfig } from './infra/config.js'

const config = resolveAppConfig()
const app = buildApp()

try {
  await app.listen({
    host: '0.0.0.0',
    port: config.port
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
