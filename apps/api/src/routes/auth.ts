import type { FastifyPluginAsync } from "fastify";
import { verifySsoCode } from "../services/sso-verifier.js";
import type { AuthCallbackResponse, AuthSessionResponse } from "../types/auth.js";

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
