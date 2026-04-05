// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

const completeAuthCallbackMock = vi.hoisted(() => vi.fn())

vi.mock('../src/services/auth-methods', () => ({
  completeAuthCallback: completeAuthCallbackMock,
  createAuthLoginUrl: vi.fn(),
  fetchSession: vi.fn(async () => ({ status: 'anonymous' as const })),
  redirectToLogin: vi.fn()
}))

import AuthCallbackCard from '../src/features/auth/components/AuthCallbackCard.vue'
import { createAppRouter } from '../src/router'
import { useAuthStore } from '../src/stores/auth-store'

interface SuccessfulCallbackPayload {
  status: 'authenticated'
  user: {
    id: string
    displayName: string
  }
  returnTo: string
  message: string
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return {
    promise,
    resolve,
    reject
  }
}

async function mountAuthCallbackCard(path = '/auth/callback?code=valid-code&state=good-state') {
  const pinia = createPinia()
  const router = createAppRouter({
    history: createMemoryHistory()
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(AuthCallbackCard, {
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return {
    authStore: useAuthStore(pinia),
    router,
    wrapper
  }
}

describe('auth callback card', () => {
  beforeEach(() => {
    completeAuthCallbackMock.mockReset()
  })

  it('processes the callback and restores the previous route after success', async () => {
    const callbackDeferred = createDeferred<SuccessfulCallbackPayload>()
    const callbackPayload: SuccessfulCallbackPayload = {
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      },
      returnTo: '/note/o/demo123',
      message: '登录已完成，正在返回刚才的页面。'
    }
    completeAuthCallbackMock.mockReturnValue(callbackDeferred.promise)

    const { authStore, router, wrapper } = await mountAuthCallbackCard()

    expect(wrapper.text()).toContain('正在完成登录')
    expect(completeAuthCallbackMock).toHaveBeenCalledWith({
      code: 'valid-code',
      state: 'good-state',
    })

    callbackDeferred.resolve(callbackPayload)
    await flushPromises()

    expect(authStore.status).toBe('authenticated')
    expect(router.currentRoute.value.fullPath).toBe('/note/o/demo123')
  })

  it('shows a stable error state and lets the user go back home when callback recovery fails', async () => {
    completeAuthCallbackMock.mockRejectedValue({
      response: {
        data: {
          status: 'error',
          code: 'AUTH_STATE_INVALID',
          message: '登录回跳已失效，请返回来源页重新发起登录。'
        }
      }
    })

    const { authStore, router, wrapper } = await mountAuthCallbackCard(
      '/auth/callback?code=broken-code&state=expired-state'
    )
    await flushPromises()

    expect(authStore.status).toBe('anonymous')
    expect(wrapper.text()).toContain('登录回跳已失效')
    expect(wrapper.text()).toContain('返回首页')

    await wrapper.get('[data-testid="auth-callback-home"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('treats a callback without state as an invalid recovery instead of a missing code', async () => {
    const { authStore, wrapper } = await mountAuthCallbackCard('/auth/callback?code=valid-code')
    await flushPromises()

    expect(authStore.status).toBe('anonymous')
    expect(completeAuthCallbackMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('登录回跳已失效')
    expect(wrapper.text()).not.toContain('缺少必要 code')
  })
})
