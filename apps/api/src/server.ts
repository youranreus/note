import "dotenv/config";
import { buildApp } from "./app.js";

async function bootstrap() {
  const app = await buildApp();
  const port = app.appConfig.port;
  const host = "0.0.0.0";

  try {
    await app.listen({ port, host });
    app.log.info(`API started on ${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
