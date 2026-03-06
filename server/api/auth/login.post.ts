import { UserAPI } from '@reus-able/sso-utils'
import { findOrCreateUser } from '~/server/database/repos/userRepo'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  if (!code) return sendError(event, createError({ statusCode: 400, statusMessage: 'code required' }))

  const config = useRuntimeConfig()
  const api = UserAPI({
    SSO_URL: config.ssoUrl,
    SSO_ID: config.ssoId,
    SSO_SECRET: config.ssoSecret,
    SSO_REDIRECT: config.ssoRedirect,
  })

  try {
    const tokenRes = await api.authorizeToken(code as string)
    const token = tokenRes.data?.access_token || tokenRes.data?.data?.access_token

    const userRes = await api.getUserInfo(token)
    const ssoUser = userRes.data?.data || userRes.data

    const user = await findOrCreateUser(ssoUser.id, ssoUser.email)

    await setUserSession(event, {
      user: { id: user.id, email: user.email, role: user.role },
    })

    return { id: user.id, email: user.email, role: user.role }
  } catch (e) {
    return handleError(e, event)
  }
})
