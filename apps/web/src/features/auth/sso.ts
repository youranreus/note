export function getSsoLoginUrl() {
  const ssoUrl = import.meta.env.VITE_SSO_URL ?? "";
  const ssoId = import.meta.env.VITE_SSO_ID ?? "";
  const ssoRedirect = import.meta.env.VITE_SSO_REDIRECT ?? `${window.location.origin}/auth/callback`;

  if (!ssoUrl || !ssoId) {
    return "/auth/callback?code=mock:1001:Demo%20User";
  }

  const base = ssoUrl.replace(/\/+$/, "");
  // 不使用 URLSearchParams，避免 redirect_uri 被 percent-encode（与 SSO 侧约定一致）
  return `${base}/oauth/authorize?client_id=${ssoId}&redirect_uri=${ssoRedirect}`;
}
