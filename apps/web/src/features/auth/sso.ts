import { UserAPI } from "@reus-able/sso-utils";

export function getSsoLoginUrl() {
  const ssoUrl = import.meta.env.VITE_SSO_URL ?? "";
  const ssoId = import.meta.env.VITE_SSO_ID ?? "";
  const ssoRedirect = import.meta.env.VITE_SSO_REDIRECT ?? `${window.location.origin}/auth/callback`;

  if (!ssoUrl || !ssoId) {
    return "/auth/callback?code=mock:1001:Demo%20User";
  }

  const base = ssoUrl.replace(/\/+$/, "");
  return UserAPI({
    SSO_URL: base,
    SSO_ID: ssoId,
    SSO_SECRET: "",
    SSO_REDIRECT: ssoRedirect
  }).getRedirectLink();
}
