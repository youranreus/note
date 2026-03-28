import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const fakeUserService = {
  async upsertBySsoId() {
    return;
  }
};

function extractSidCookie(setCookies: string[]): string | null {
  const line = setCookies.find(item => item.startsWith("sid="));
  if (!line) return null;
  const value = line.split(";")[0];
  return value.replace("sid=", "");
}

describe("auth route integration", () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    while (apps.length > 0) {
      const app = apps.pop();
      if (app) await app.close();
    }
  });

  it("callback -> session -> logout should be stable", async () => {
    const app = await buildApp({
      config: {
        nodeEnv: "test",
        webOrigin: "http://localhost:5173",
        cookieSecure: false,
        ssoMockEnabled: true
      },
      userService: fakeUserService
    });
    apps.push(app);
    await app.ready();

    const callbackRes = await app.inject({
      method: "GET",
      url: "/api/auth/callback?code=mock:1001:Demo%20User"
    });
    expect(callbackRes.statusCode).toBe(200);
    expect(callbackRes.json()).toEqual({
      ok: true,
      user: {
        ssoId: 1001,
        name: "Demo User"
      }
    });

    const sid = extractSidCookie(callbackRes.cookies.map(c => `${c.name}=${c.value}`));
    expect(sid).toBeTruthy();

    const sessionRes = await app.inject({
      method: "GET",
      url: "/api/auth/session",
      cookies: {
        sid: sid ?? ""
      }
    });
    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.json()).toEqual({
      logged: true,
      user: {
        ssoId: 1001,
        name: "Demo User"
      }
    });

    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      cookies: {
        sid: sid ?? ""
      }
    });
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.json()).toEqual({ ok: true });

    const sessionAfterLogoutRes = await app.inject({
      method: "GET",
      url: "/api/auth/session",
      cookies: {
        sid: sid ?? ""
      }
    });
    expect(sessionAfterLogoutRes.statusCode).toBe(200);
    expect(sessionAfterLogoutRes.json()).toEqual({
      logged: false
    });
  });
});
