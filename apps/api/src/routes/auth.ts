import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError
} from "@prisma/client/runtime/library";
import type { FastifyPluginAsync } from "fastify";
import { verifySsoCode } from "../services/sso-verifier.js";
import type { AuthCallbackResponse, AuthSessionResponse } from "../types/auth.js";

type DatabaseCallbackIssue = "unreachable" | "schema_missing" | null;

function classifyDatabaseCallbackIssue(error: unknown): DatabaseCallbackIssue {
  if (error instanceof PrismaClientInitializationError) {
    return "unreachable";
  }
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1017") {
      return "unreachable";
    }
    if (error.code === "P2021") {
      return "schema_missing";
    }
  }
  if (error instanceof Error && /Can't reach database server/i.test(error.message)) {
    return "unreachable";
  }
  if (error instanceof Error && /does not exist in the current database/i.test(error.message)) {
    return "schema_missing";
  }
  return null;
}

function cookieSetOptions(secure: boolean, ttlSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: ttlSeconds
  };
}

function cookieClearOptions(secure: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure
  };
}

export const authRoutes: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: { code?: string } }>("/callback", async (request, reply) => {
    const code = request.query.code;
    if (!code) {
      return reply.code(400).send({
        code: "BAD_REQUEST",
        message: "code is required"
      });
    }

    try {
      const user = await verifySsoCode(code, fastify.appConfig);
      await fastify.userService.upsertBySsoId(user);

      const sid = fastify.createSession(user);
      reply.setCookie(
        fastify.appConfig.cookieName,
        sid,
        cookieSetOptions(fastify.appConfig.cookieSecure, fastify.appConfig.sessionTtlSeconds)
      );

      const payload: AuthCallbackResponse = {
        ok: true,
        user
      };
      return payload;
    } catch (error) {
      request.log.warn({ error }, "SSO callback verification failed");
      const dbIssue = classifyDatabaseCallbackIssue(error);
      if (dbIssue === "unreachable") {
        return reply.code(503).send({
          code: "DATABASE_UNAVAILABLE",
          message: "数据库暂时不可用，请确认 MySQL 已启动且 DATABASE_URL 正确。"
        });
      }
      if (dbIssue === "schema_missing") {
        return reply.code(503).send({
          code: "DATABASE_SCHEMA_MISSING",
          message:
            "数据库表尚未创建。在 apps/api 下执行：pnpm prisma migrate deploy（本地开发也可用 prisma migrate dev）。"
        });
      }
      return reply.code(401).send({
        code: "INVALID_CODE",
        message: "code is invalid or expired"
      });
    }
  });

  fastify.get(
    "/session",
    {
      preHandler: fastify.optionalAuth
    },
    async request => {
      if (!request.user) {
        const payload: AuthSessionResponse = { logged: false };
        return payload;
      }

      const payload: AuthSessionResponse = {
        logged: true,
        user: request.user
      };
      return payload;
    }
  );

  fastify.post(
    "/logout",
    {
      preHandler: fastify.optionalAuth
    },
    async (request, reply) => {
      const sid = request.cookies[fastify.appConfig.cookieName];
      if (sid) {
        fastify.deleteSession(sid);
      }

      reply.clearCookie(
        fastify.appConfig.cookieName,
        cookieClearOptions(fastify.appConfig.cookieSecure)
      );
      return { ok: true };
    }
  );
};
