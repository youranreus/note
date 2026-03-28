import fp from "fastify-plugin";

interface AuthPluginOptions {
  cookieName: string;
  cookieSecure: boolean;
}

function cookieClearOptions(secure: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure
  };
}

export const authPlugin = fp<AuthPluginOptions>(
  async (fastify, options) => {
    const { cookieName, cookieSecure } = options;

  fastify.decorateRequest("user", null);

    fastify.decorate("optionalAuth", async function optionalAuth(request, reply) {
      request.user = null;
      const sid = request.cookies[cookieName];
      if (!sid) return;

      const record = fastify.getSession(sid);
      if (!record) {
        reply.clearCookie(cookieName, cookieClearOptions(cookieSecure));
        return;
      }

      request.user = record.user;
    });

    fastify.decorate("requireAuth", async function requireAuth(request, reply) {
      await fastify.optionalAuth(request, reply);
      if (!request.user) {
        return reply.code(401).send({
          code: "UNAUTHORIZED",
          message: "Authentication required"
        });
      }
    });
  }
);
