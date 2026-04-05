import type {
  AuthCallbackErrorDto,
  AuthCallbackResponseDto,
  SessionResponseDto
} from '@note/shared-types'

import { normalizeAuthReturnToPath } from '@note/shared-types'

export interface AuthCallbackCardModel {
  title: string
  description: string
  feedbackTone: 'info' | 'success' | 'danger'
  feedbackTitle: string
  feedbackDescription: string
  loading: boolean
}

export function resolveAuthCallbackQuery(query: Record<string, unknown>) {
  const code = typeof query.code === 'string' && query.code.trim() ? query.code.trim() : null
  const state = typeof query.state === 'string' && query.state.trim() ? query.state.trim() : null

  return {
    code,
    state
  }
}

export function isAuthenticatedSessionResponse(
  response: SessionResponseDto
): response is Extract<SessionResponseDto, { status: 'authenticated' }> {
  return response.status === 'authenticated'
}

export function isAuthCallbackSuccess(
  response: AuthCallbackResponseDto
): response is Extract<AuthCallbackResponseDto, { status: 'authenticated' }> {
  return response.status === 'authenticated'
}

export function resolveAuthCallbackError(error: unknown): AuthCallbackErrorDto {
  const errorPayload =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : null

  if (
    errorPayload &&
    typeof errorPayload === 'object' &&
    'status' in errorPayload &&
    errorPayload.status === 'error' &&
    'code' in errorPayload &&
    'message' in errorPayload
  ) {
    return errorPayload as AuthCallbackErrorDto
  }

  return {
    status: 'error',
    code: 'AUTH_CALLBACK_FAILED',
    message: '登录回跳处理失败，请返回来源页后重新发起登录。'
  }
}

export function resolveAuthCallbackCardModel(input: {
  phase: 'loading' | 'success' | 'error'
  message?: string
}) {
  const stateMap: Record<typeof input.phase, AuthCallbackCardModel> = {
    loading: {
      title: '正在完成登录',
      description: '我们正在校验回跳参数、建立安全会话，并准备恢复你刚才所在的页面。',
      feedbackTone: 'info',
      feedbackTitle: '请稍候',
      feedbackDescription: '状态提示不会只依赖视觉装饰，完成后会自动返回原上下文。',
      loading: true
    },
    success: {
      title: '登录已完成',
      description: input.message ?? '会话已经建立完成，正在返回刚才的页面。',
      feedbackTone: 'success',
      feedbackTitle: '正在恢复上下文',
      feedbackDescription: '如果来源页合法，我们会优先回到你刚才所在的站内页面。',
      loading: false
    },
    error: {
      title: '登录暂时没有完成',
      description: input.message ?? '回跳恢复失败，请返回首页后重新发起登录。',
      feedbackTone: 'danger',
      feedbackTitle: '需要重新发起登录',
      feedbackDescription: '当前不会跳去未知页面。你可以先回到首页，再从需要升级能力的入口继续。',
      loading: false
    }
  }

  return stateMap[input.phase]
}

export function resolveSafeReturnTo(path: string | null | undefined) {
  return normalizeAuthReturnToPath(path, '/')
}
