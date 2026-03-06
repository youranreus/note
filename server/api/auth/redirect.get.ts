import { getRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { UserAPI } = await import('@reus-able/sso-utils')
  const api = UserAPI({
    SSO_URL: config.ssoUrl,
    SSO_ID: config.ssoId,
    SSO_SECRET: config.ssoSecret,
    SSO_REDIRECT: config.ssoRedirect,
  })
  return { url: api.getRedirectLink() }
})
