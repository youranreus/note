import type { AppConfig } from "../config.js";
import type { UserSummary } from "../types/auth.js";

interface MaybeUser {
  ssoId?: number | string;
  id?: number | string;
  name?: string;
  avatar?: string;
}

interface MaybeTokenPayload {
  access_token?: string;
  token?: string;
  token_type?: string;
}

interface SsoClient {
  authorizeToken: (code: string) => Promise<{ data: MaybeTokenPayload }>;
  getUserInfo: (token: string) => Promise<{ data: { data?: MaybeUser } | MaybeUser }>;
}

function normalizeUser(payload: MaybeUser): UserSummary {
  const rawId = payload.ssoId ?? payload.id;
  const ssoId = Number(rawId);
  if (!Number.isFinite(ssoId)) {
    throw new Error("Invalid SSO payload: missing ssoId");
  }
  return {
    ssoId,
    name: payload.name,
    avatar: payload.avatar
  };
}

function parseMockCode(code: string, prefix: string): UserSummary {
  if (!code.startsWith(prefix)) {
    throw new Error("Invalid mock code prefix");
  }

  const raw = code.slice(prefix.length);
  const [idPart, namePart = "Demo User", avatarPart] = raw.split(":");
  const ssoId = Number(idPart);
  if (!Number.isFinite(ssoId)) {
    throw new Error("Invalid mock code user id");
  }

  return {
    ssoId,
    name: decodeURIComponent(namePart),
    avatar: avatarPart ? decodeURIComponent(avatarPart) : undefined
  };
}

function ensureSsoConfig(config: AppConfig) {
  if (!config.ssoUrl || !config.ssoId || !config.ssoSecret || !config.ssoRedirect) {
    throw new Error("Missing SSO env config");
  }
}

async function createSsoClient(config: AppConfig): Promise<SsoClient> {
  const lib = (await import("@reus-able/sso-utils")) as {
    UserAPI?: (env: {
      SSO_URL: string;
      SSO_ID: string;
      SSO_SECRET?: string;
      SSO_REDIRECT: string;
    }) => SsoClient;
  };

  if (typeof lib.UserAPI !== "function") {
    throw new Error("UserAPI is not exported by @reus-able/sso-utils");
  }

  return lib.UserAPI({
    SSO_URL: config.ssoUrl,
    SSO_ID: config.ssoId,
    SSO_SECRET: config.ssoSecret,
    SSO_REDIRECT: config.ssoRedirect
  });
}

async function exchangeCodeForAccessToken(
  code: string,
  client: SsoClient
): Promise<string> {
  const tokenResponse = await client.authorizeToken(code);
  const tokenPayload = tokenResponse?.data ?? {};
  const accessToken = tokenPayload.access_token ?? tokenPayload.token;
  if (!accessToken) {
    throw new Error("SSO token response missing access token");
  }
  if (tokenPayload.token_type) {
    return `${tokenPayload.token_type} ${accessToken}`;
  }
  return accessToken;
}

async function getUserByAccessToken(token: string, client: SsoClient): Promise<UserSummary> {
  const userResponse = await client.getUserInfo(token);
  const userPayload = userResponse?.data ?? {};
  const payload = (userPayload as { data?: MaybeUser }).data ?? (userPayload as MaybeUser);
  return normalizeUser(payload);
}

export async function verifySsoCode(code: string, config: AppConfig): Promise<UserSummary> {
  const mockPrefix = config.ssoMockTicketPrefix;
  if (code.startsWith(mockPrefix)) {
    if (!config.ssoMockEnabled) {
      throw new Error("Mock SSO is disabled");
    }
    return parseMockCode(code, mockPrefix);
  }

  ensureSsoConfig(config);
  const client = await createSsoClient(config);
  const token = await exchangeCodeForAccessToken(code, client);
  return getUserByAccessToken(token, client);
}
