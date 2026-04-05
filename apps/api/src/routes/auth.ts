import type { FastifyPluginAsync } from 'fastify'

import { normalizeAuthReturnToPath, type AuthCallbackErrorDto } from '@note/shared-types'

import { createModuleScopeMessage } from '../services/module-shell-service.js'
import { AuthSsoServiceError } from '../services/auth-sso-service.js'

function createAuthError(code: AuthCallbackErrorDto['code'], message: string): AuthCallbackErrorDto {
  return {
    status: 'error',
    code,
    message
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: {
      returnTo?: string
    }
  }>('/login', async (request, reply) => {
    const returnTo = normalizeAuthReturnToPath(request.query.returnTo, '/')
    const pendingFlow = app.authSessionService.createPendingFlow(returnTo)

    reply.setCookie(
      app.authConfig.authFlowCookieName,
      app.authSessionService.serializePendingFlow(pendingFlow),
      {
        httpOnly: true,
        maxAge: 10 * 60,
        path: '/',
        sameSite: 'lax',
        secure: app.authConfig.cookieSecure
      }
    )

    return reply.redirect(app.authSsoService.buildAuthorizeUrl({ state: pendingFlow.state }))
  })

  app.get<{
    Querystring: {
      state?: string
      code?: string
    }
  }>('/callback', async (request, reply) => {
    if (!request.query.code?.trim()) {
      return reply.status(400).send(
        createAuthError('AUTH_CODE_MISSING', '登录回跳缺少必要 code，请返回来源页重新发起登录。')
      )
    }

    const pendingFlow = app.authSessionService.parsePendingFlow(
      request.cookies[app.authConfig.authFlowCookieName]
    )
    const state = request.query.state?.trim()

    if (!pendingFlow || !state || pendingFlow.state !== state) {
      reply.clearCookie(app.authConfig.authFlowCookieName, {
        path: '/'
      })

      return reply.status(400).send(
        createAuthError('AUTH_STATE_INVALID', '登录回跳已失效，请返回来源页重新发起登录。')
      )
    }

    try {
      const user = await app.authSsoService.exchangeCode(request.query.code.trim())
      const sessionId = app.authSessionService.createSession(user)

      reply.setCookie(app.authConfig.cookieName, sessionId, {
        httpOnly: true,
        maxAge: app.authConfig.sessionTtlSeconds,
        path: '/',
        sameSite: 'lax',
        secure: app.authConfig.cookieSecure
      })
      reply.clearCookie(app.authConfig.authFlowCookieName, {
        path: '/'
      })

      return {
        status: 'authenticated',
        user,
        returnTo: pendingFlow.returnTo,
        message: '登录已完成，正在恢复原页面上下文。'
      }
    } catch (error) {
      const message =
        error instanceof AuthSsoServiceError
          ? error.message
          : 'SSO 回调处理失败，请稍后重试或联系管理员。'

      reply.clearCookie(app.authConfig.authFlowCookieName, {
        path: '/'
      })

      return reply.status(502).send(createAuthError('AUTH_CALLBACK_FAILED', message))
    }
  })

  app.get('/shell-status', async () => ({
    module: 'auth',
    scope: createModuleScopeMessage('auth')
  }))
}
