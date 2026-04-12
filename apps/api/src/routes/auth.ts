import type { FastifyPluginAsync } from 'fastify'

import {
  normalizeAuthReturnToPath,
  type AuthCallbackErrorDto,
  type PostLoginActionDto
} from '@note/shared-types'

import {
  logOperation,
  sanitizeReturnToPathForLog,
  toLogIdentifierHint
} from '../infra/operation-log.js'
import { createModuleScopeMessage } from '../services/module-shell-service.js'
import { AuthSsoServiceError } from '../services/auth-sso-service.js'

function createAuthError(code: AuthCallbackErrorDto['code'], message: string): AuthCallbackErrorDto {
  return {
    status: 'error',
    code,
    message
  }
}

function resolvePostLoginAction(input: {
  intent?: string
  sid?: string
}): PostLoginActionDto | null {
  if (input.intent !== 'favorite-note') {
    return null
  }

  const normalizedSid = input.sid?.trim()

  if (!normalizedSid) {
    return null
  }

  return {
    type: 'favorite-note',
    sid: normalizedSid
  }
}

function describePostLoginAction(postLoginAction: PostLoginActionDto | null) {
  if (postLoginAction?.type !== 'favorite-note') {
    return ''
  }

  return `，登录后将继续收藏便签(${toLogIdentifierHint(postLoginAction.sid)})`
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: {
      returnTo?: string
      intent?: string
      sid?: string
    }
  }>('/login', async (request, reply) => {
    const returnTo = normalizeAuthReturnToPath(request.query.returnTo, '/')
    const postLoginAction = resolvePostLoginAction({
      intent: request.query.intent,
      sid: request.query.sid
    })
    const pendingFlow = app.authSessionService.createPendingFlow(
      returnTo,
      postLoginAction
    )

    logOperation(
      `登录流程已启动，完成后将返回 ${sanitizeReturnToPathForLog(returnTo)}${describePostLoginAction(postLoginAction)}。`
    )

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
      logOperation('登录失败：回调缺少授权 code。')

      return reply.status(400).send(
        createAuthError('AUTH_CODE_MISSING', '登录回跳缺少必要 code，请返回来源页重新发起登录。')
      )
    }

    const pendingFlow = app.authSessionService.parsePendingFlow(
      request.cookies[app.authConfig.authFlowCookieName]
    )
    const state = request.query.state?.trim()

    if (!pendingFlow || !state || pendingFlow.state !== state) {
      logOperation('登录失败：回调 state 无效或已过期。')

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

      logOperation(
        `用户(${toLogIdentifierHint(user.id)}) 登录成功，将返回 ${sanitizeReturnToPathForLog(pendingFlow.returnTo)}${describePostLoginAction(pendingFlow.postLoginAction)}。`
      )

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
        postLoginAction: pendingFlow.postLoginAction,
        message: '登录已完成，正在恢复原页面上下文。'
      }
    } catch (error) {
      const message =
        error instanceof AuthSsoServiceError
          ? error.message
          : 'SSO 回调处理失败，请稍后重试或联系管理员。'

      logOperation(
        `登录失败：${error instanceof AuthSsoServiceError ? error.code : 'AUTH_CALLBACK_FAILED'}，原计划返回 ${sanitizeReturnToPathForLog(pendingFlow.returnTo)}${describePostLoginAction(pendingFlow.postLoginAction)}。`
      )

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
