import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async fastify => {
  fastify.get("/health", async () => ({
    ok: true,
    service: "note-api",
    timestamp: new Date().toISOString()
  }));
};
