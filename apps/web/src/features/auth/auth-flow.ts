import type {
  AuthCallbackErrorDto,
  AuthCallbackResponseDto,
  SessionResponseDto
} from '@note/shared-types'

import { normalizeAuthReturnToPath } from '@note/shared-types'

import {
  createPoliteInlineFeedback,
  type InlineFeedbackModel
} from '@/components/ui/inline-feedback'

export interface AuthCallbackCardModel {
  title: string
  description: string
  feedback: InlineFeedbackModel
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
  code?: AuthCallbackErrorDto['code'] | null
  message?: string
}) {
  if (input.phase === 'loading') {
    return {
      title: '正在完成登录',
      description: '我们正在校验回跳参数、建立安全会话，并准备恢复你刚才所在的页面。',
      feedback: createPoliteInlineFeedback({
        tone: 'info',
        state: 'focus',
        title: '请稍候',
        description: '正在核验回跳参数并恢复上下文，完成后会自动返回原页面。'
      }),
      loading: true
    } satisfies AuthCallbackCardModel
  }

  if (input.phase === 'success') {
    return {
      title: '登录已完成',
      description: input.message ?? '会话已经建立完成，正在返回刚才的页面。',
      feedback: createPoliteInlineFeedback({
        tone: 'success',
        state: 'default',
        title: '正在恢复上下文',
        description: '如果来源页合法，我们会优先返回你刚才所在的站内页面。'
      }),
      loading: false
    } satisfies AuthCallbackCardModel
  }

  const errorCardMap: Record<AuthCallbackErrorDto['code'], AuthCallbackCardModel> = {
    AUTH_CODE_MISSING: {
      title: '登录链接不完整',
      description: input.message ?? '当前回跳缺少必要参数，请返回首页后重新发起登录。',
      feedback: createPoliteInlineFeedback({
        tone: 'warning',
        state: 'default',
        title: '返回首页重新登录',
        description: '当前不会跳去未知页面。请先返回首页，再从需要登录的入口重新发起登录。'
      }),
      loading: false
    },
    AUTH_STATE_INVALID: {
      title: '登录回跳已失效',
      description: input.message ?? '当前登录回跳已经失效，请返回首页后重新发起登录。',
      feedback: createPoliteInlineFeedback({
        tone: 'warning',
        state: 'default',
        title: '返回首页重新登录',
        description: '当前不会跳去未知页面。请先回到首页，再从需要升级能力的入口重新发起登录。'
      }),
      loading: false
    },
    AUTH_CALLBACK_FAILED: {
      title: '登录暂时没有完成',
      description: input.message ?? '登录回跳处理失败，请返回首页后重新发起登录。',
      feedback: createPoliteInlineFeedback({
        tone: 'danger',
        state: 'error',
        title: '稍后重试或返回首页',
        description: '当前不会跳去未知页面。你可以先回到首页重新发起登录，或稍后再试。'
      }),
      loading: false
    }
  }

  return errorCardMap[input.code ?? 'AUTH_CALLBACK_FAILED'] ?? errorCardMap.AUTH_CALLBACK_FAILED
}

export function resolveSafeReturnTo(path: string | null | undefined) {
  return normalizeAuthReturnToPath(path, '/')
}
