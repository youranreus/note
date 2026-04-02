export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export function resolveCallbackUrl() {
  return import.meta.env.VITE_SSO_REDIRECT ?? '/auth/callback'
}
