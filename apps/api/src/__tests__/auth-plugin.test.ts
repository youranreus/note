import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const fakeUserService = {
  async upsertBySsoId() {
    return;
  }
};

async function createTestApp() {
  const app = await buildApp({
    config: {
      nodeEnv: "test",
      webOrigin: "http://localhost:5173",
      cookieSecure: false,
      ssoMockEnabled: true
    },
    userService: fakeUserService
  });

  app.get(
    "/test/optional",
    {
      preHandler: app.optionalAuth
    },
    async request => ({ user: request.user })
  );

  app.get(
    "/test/require",
    {
      preHandler: app.requireAuth
    },
    async () => ({ ok: true })
  );

  await app.ready();
  return app;
}

const appsToClose: Array<Awaited<ReturnType<typeof createTestApp>>> = [];

afterEach(async () => {
  while (appsToClose.length > 0) {
    const app = appsToClose.pop();
    if (app) await app.close();
  }
});

describe("auth plugin preHandlers", () => {
  it("optionalAuth should pass with no cookie", async () => {
    const app = await createTestApp();
    appsToClose.push(app);

    const res = await app.inject({
      method: "GET",
      url: "/test/optional"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ user: null });
  });

  it("requireAuth should reject when cookie is missing", async () => {
    const app = await createTestApp();
    appsToClose.push(app);

    const res = await app.inject({
      method: "GET",
      url: "/test/require"
    });

    expect(res.statusCode).toBe(401);
  });

  it("requireAuth should reject bad cookie", async () => {
    const app = await createTestApp();
    appsToClose.push(app);

    const res = await app.inject({
      method: "GET",
      url: "/test/require",
      cookies: {
        sid: "invalid-session-id"
      }
    });

    expect(res.statusCode).toBe(401);
  });

  it("optionalAuth should ignore expired cookie", async () => {
    const app = await createTestApp();
    appsToClose.push(app);

    const sid = app.createSession({ ssoId: 1001, name: "User A" }, -1);
    const res = await app.inject({
      method: "GET",
      url: "/test/optional",
      cookies: { sid }
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ user: null });
  });
});
