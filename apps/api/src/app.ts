import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { loadConfig, type AppConfig } from "./config.js";
import { prisma } from "./infra/prisma/client.js";
import { authPlugin } from "./plugins/auth.js";
import { sessionPlugin } from "./plugins/session.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { createPrismaUserService, type UserService } from "./services/user-service.js";

interface BuildAppOptions {
  config?: Partial<AppConfig>;
  userService?: UserService;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const appConfig = loadConfig(options.config);
  const app = Fastify({
    logger: {
      level: appConfig.nodeEnv === "production" ? "info" : "debug"
    }
  });

  app.decorate("appConfig", appConfig);
  app.decorate("userService", options.userService ?? createPrismaUserService(prisma));

  await app.register(cors, {
    origin: appConfig.webOrigin,
    credentials: true
  });

  await app.register(cookie);
  await app.register(sessionPlugin, { ttlSeconds: appConfig.sessionTtlSeconds });
  await app.register(authPlugin, {
    cookieName: appConfig.cookieName,
    cookieSecure: appConfig.cookieSecure
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/auth" });

  return app;
}
