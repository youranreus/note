export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  apiOrigin: string;
  webOrigin: string;
  ssoUrl: string;
  /** Origin for token/userinfo HTTP calls when POST is blocked on ssoUrl (e.g. CDN GET-only). */
  ssoApiBaseUrl: string;
  ssoId: string;
  ssoSecret: string;
  ssoRedirect: string;
  cookieName: string;
  cookieSecure: boolean;
  sessionTtlSeconds: number;
  ssoMockEnabled: boolean;
  ssoMockTicketPrefix: string;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
  return {
    nodeEnv,
    port: parseNumber(process.env.PORT, 3001),
    apiOrigin: process.env.API_ORIGIN ?? "http://localhost:3001",
    webOrigin,
    ssoUrl: process.env.SSO_URL ?? "",
    ssoApiBaseUrl: process.env.SSO_API_BASE_URL ?? "",
    ssoId: process.env.SSO_ID ?? "",
    ssoSecret: process.env.SSO_SECRET ?? "",
    ssoRedirect: process.env.SSO_REDIRECT ?? `${webOrigin}/auth/callback`,
    cookieName: process.env.COOKIE_NAME ?? "sid",
    cookieSecure: parseBoolean(process.env.COOKIE_SECURE, nodeEnv === "production"),
    sessionTtlSeconds: parseNumber(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24 * 7),
    ssoMockEnabled: parseBoolean(process.env.SSO_MOCK_ENABLED, nodeEnv !== "production"),
    ssoMockTicketPrefix: process.env.SSO_MOCK_TICKET_PREFIX ?? "mock:",
    ...overrides
  };
}
