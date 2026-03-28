import { randomUUID } from "node:crypto";
import fp from "fastify-plugin";
import type { UserSummary } from "../types/auth.js";

export interface SessionRecord {
  sid: string;
  user: UserSummary;
  expiresAt: number;
}

interface SessionPluginOptions {
  ttlSeconds: number;
}

export const sessionPlugin = fp<SessionPluginOptions>(
  async (fastify, options) => {
    const sessions = new Map<string, SessionRecord>();
    const defaultTtlMs = options.ttlSeconds * 1000;

    fastify.decorate("createSession", (user: UserSummary, ttlMs?: number) => {
      const sid = randomUUID();
      const expiresAt = Date.now() + (ttlMs ?? defaultTtlMs);
      sessions.set(sid, { sid, user, expiresAt });
      return sid;
    });

    fastify.decorate("getSession", (sid: string) => {
      const record = sessions.get(sid);
      if (!record) return null;
      if (Date.now() >= record.expiresAt) {
        sessions.delete(sid);
        return null;
      }
      return record;
    });

    fastify.decorate("deleteSession", (sid: string) => {
      sessions.delete(sid);
    });
  }
);
