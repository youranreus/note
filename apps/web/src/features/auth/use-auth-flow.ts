import { computed, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { AuthCallbackErrorDto } from '@note/shared-types'
import type { AuthCallbackCardModel } from './auth-flow'

import { useAuthStore } from '@/stores/auth-store'
import {
  completeAuthCallback,
  createAuthLoginUrl,
  fetchSession,
  redirectToLogin
} from '@/services/auth-methods'

import {
  isAuthenticatedSessionResponse,
  isAuthCallbackSuccess,
  resolveAuthCallbackCardModel,
  resolveAuthCallbackError,
  resolveAuthCallbackQuery,
  resolveSafeReturnTo
} from './auth-flow'

export function useAuthFlow() {
  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const { loginIntent, loginModalOpen, sessionHydrated, status } = storeToRefs(authStore)
  const callbackPhase = shallowRef<'loading' | 'success' | 'error'>('loading')
  const callbackErrorCode = shallowRef<AuthCallbackErrorDto['code'] | null>(null)
  const callbackMessage = shallowRef<string | null>(null)
  let sessionRequest: Promise<void> | null = null

  async function hydrateSession() {
    if (sessionHydrated.value || status.value === 'recovering') {
      return
    }

    if (sessionRequest) {
      await sessionRequest
      return
    }

    sessionRequest = (async () => {
      try {
        const session = await fetchSession()

        if (isAuthenticatedSessionResponse(session)) {
          authStore.setAuthenticated(session)
          return
        }

        authStore.setAnonymous()
      } catch {
        authStore.setAnonymous()
      } finally {
        authStore.markSessionHydrated()
        sessionRequest = null
      }
    })()

    await sessionRequest
  }

  function openLoginModal() {
    authStore.openLoginModal()
  }

  function closeLoginModal() {
    authStore.closeLoginModal()
  }

  function startLoginUpgrade() {
    const returnTo = resolveSafeReturnTo(route.fullPath)
    const loginUrl = createAuthLoginUrl(returnTo, loginIntent.value)

    authStore.closeLoginModal()
    redirectToLogin(loginUrl)
  }

  async function processCallback() {
    authStore.setRecovering()
    callbackPhase.value = 'loading'
    callbackErrorCode.value = null
    callbackMessage.value = null

    const { code, state } = resolveAuthCallbackQuery(route.query)

    if (!code) {
      const error = resolveAuthCallbackError({
        response: {
          data: {
            status: 'error',
            code: 'AUTH_CODE_MISSING',
            message: '登录回跳缺少必要 code，请返回来源页重新发起登录。'
          }
        }
      })

      callbackPhase.value = 'error'
      callbackErrorCode.value = error.code
      callbackMessage.value = error.message
      authStore.setAnonymous()
      return
    }

    if (!state) {
      const error = resolveAuthCallbackError({
        response: {
          data: {
            status: 'error',
            code: 'AUTH_STATE_INVALID',
            message: '登录回跳已失效，请返回来源页重新发起登录。'
          }
        }
      })

      callbackPhase.value = 'error'
      callbackErrorCode.value = error.code
      callbackMessage.value = error.message
      authStore.setAnonymous()
      return
    }

    try {
      const response = await completeAuthCallback({
        code,
        state
      })

      if (!isAuthCallbackSuccess(response)) {
        callbackPhase.value = 'error'
        callbackErrorCode.value = response.code
        callbackMessage.value = response.message
        authStore.setAnonymous()
        return
      }

      authStore.setAuthenticated({
        status: 'authenticated',
        user: response.user
      }, response.postLoginAction ?? null)
      callbackPhase.value = 'success'
      callbackErrorCode.value = null
      callbackMessage.value = response.message
      await router.replace(resolveSafeReturnTo(response.returnTo))
    } catch (error) {
      const callbackError = resolveAuthCallbackError(error)

      callbackPhase.value = 'error'
      callbackErrorCode.value = callbackError.code
      callbackMessage.value = callbackError.message
      authStore.setAnonymous()
    }
  }

  async function returnHome() {
    await router.replace('/')
  }

  const callbackCard = computed<AuthCallbackCardModel>(() =>
    resolveAuthCallbackCardModel({
      phase: callbackPhase.value,
      code: callbackErrorCode.value,
      message: callbackMessage.value ?? undefined
    })
  )

  return {
    loginModalOpen,
    callbackCard,
    callbackPhase,
    closeLoginModal,
    hydrateSession,
    openLoginModal,
    processCallback,
    returnHome,
    startLoginUpgrade
  }
}
