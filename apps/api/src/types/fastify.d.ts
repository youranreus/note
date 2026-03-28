import "fastify";
import type { AppConfig } from "../config.js";
import type { SessionRecord } from "../plugins/session.js";
import type { UserService } from "../services/user-service.js";
import type { UserSummary } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user: UserSummary | null;
  }

  interface FastifyInstance {
    appConfig: AppConfig;
    userService: UserService;

    createSession: (user: UserSummary, ttlMs?: number) => string;
    getSession: (sid: string) => SessionRecord | null;
    deleteSession: (sid: string) => void;

    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
