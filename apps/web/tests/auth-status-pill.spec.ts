// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'

import type { SessionResponseDto } from '@note/shared-types'

const createAuthLoginUrlMock = vi.hoisted(() =>
  vi.fn((returnTo: string) => `http://localhost:3001/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
)
const redirectToLoginMock = vi.hoisted(() => vi.fn())
const fetchSessionMock = vi.hoisted(() =>
  vi.fn<() => Promise<SessionResponseDto>>(async () => ({ status: 'anonymous' }))
)
const meNotesRequestHarness = vi.hoisted(() => {
  let data: { value: unknown }
  let error: { value: unknown }
  let loading: { value: boolean }
  let lastArg: unknown
  let defaultState: { data: unknown; error: unknown; loading: boolean }
  let scopeStates: Map<string, { data: unknown; error: unknown; loading: boolean }>
  let requestStates: Map<string, { data: unknown; error: unknown; loading: boolean }>

  function resolveRequestKey(arg: unknown) {
    const scope =
      arg &&
      typeof arg === 'object' &&
      'cacheScope' in arg &&
      typeof arg.cacheScope === 'string'
        ? arg.cacheScope
        : 'default'
    const page =
      arg &&
      typeof arg === 'object' &&
      'query' in arg &&
      arg.query &&
      typeof arg.query === 'object' &&
      'page' in arg.query &&
      typeof arg.query.page === 'number'
        ? arg.query.page
        : 1
    const limit =
      arg &&
      typeof arg === 'object' &&
      'query' in arg &&
      arg.query &&
      typeof arg.query === 'object' &&
      'limit' in arg.query &&
      typeof arg.query.limit === 'number'
        ? arg.query.limit
        : 20

    return {
      scope,
      key: `${scope}:${page}:${limit}`
    }
  }

  return {
    reset() {
      data = { value: undefined }
      error = { value: undefined }
      loading = { value: false }
      lastArg = undefined
      defaultState = {
        data: undefined,
        error: undefined,
        loading: false
      }
      scopeStates = new Map()
      requestStates = new Map()
    },
    useRequestFactory(refFactory: typeof import('vue').ref) {
      return () => {
        data = refFactory()
        error = refFactory()
        loading = refFactory(false)

        return {
          data,
          error,
          loading,
          send(arg: unknown) {
            lastArg = arg
            const { key, scope } = resolveRequestKey(arg)
            const scopedState =
              requestStates.get(key) ??
              scopeStates.get(scope) ??
              defaultState

            data.value = scopedState.data
            error.value = scopedState.error
            loading.value = scopedState.loading

            if (scopedState.error) {
              return Promise.reject(scopedState.error)
            }

            return Promise.resolve(scopedState.data)
          },
          abort: async () => undefined
        }
      }
    },
    update(next: { data?: unknown; error?: unknown; loading?: boolean }) {
      defaultState = {
        data: 'data' in next ? next.data : defaultState.data,
        error: 'error' in next ? next.error : defaultState.error,
        loading: 'loading' in next ? next.loading ?? false : defaultState.loading
      }

      data.value = defaultState.data
      error.value = defaultState.error
      loading.value = defaultState.loading
    },
    updateForScope(scope: string, next: { data?: unknown; error?: unknown; loading?: boolean }) {
      const previous = scopeStates.get(scope) ?? defaultState
      const nextState = {
        data: 'data' in next ? next.data : previous.data,
        error: 'error' in next ? next.error : previous.error,
        loading: 'loading' in next ? next.loading ?? false : previous.loading
      }

      scopeStates.set(scope, nextState)
    },
    updateForRequest(
      scope: string,
      page: number,
      limit: number,
      next: { data?: unknown; error?: unknown; loading?: boolean }
    ) {
      const key = `${scope}:${page}:${limit}`
      const previous =
        requestStates.get(key) ??
        scopeStates.get(scope) ??
        defaultState
      const nextState = {
        data: 'data' in next ? next.data : previous.data,
        error: 'error' in next ? next.error : previous.error,
        loading: 'loading' in next ? next.loading ?? false : previous.loading
      }

      requestStates.set(key, nextState)
    },
    getLastArg() {
      return lastArg
    }
  }
})

vi.mock('../src/services/auth-methods', () => ({
  completeAuthCallback: vi.fn(),
  createAuthLoginUrl: createAuthLoginUrlMock,
  fetchSession: fetchSessionMock,
  redirectToLogin: redirectToLoginMock
}))

vi.mock('alova/client', async () => {
  const { ref } = await import('vue')

  return {
    useRequest: meNotesRequestHarness.useRequestFactory(ref)
  }
})

import AuthStatusPill from '../src/components/layout/AuthStatusPill.vue'
import { createAppRouter } from '../src/router'
import { useAuthStore } from '../src/stores/auth-store'

async function mountAuthStatusPill(path = '/note/o/demo123') {
  const pinia = createPinia()
  const router = createAppRouter({
    history: createMemoryHistory()
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(AuthStatusPill, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return {
    pinia,
    router,
    wrapper
  }
}

describe('auth status pill', () => {
  beforeEach(() => {
    createAuthLoginUrlMock.mockClear()
    redirectToLoginMock.mockClear()
    fetchSessionMock.mockClear()
    meNotesRequestHarness.reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the SSO confirm modal, keeps the current page on cancel, and returns focus to the trigger', async () => {
    const { router, wrapper } = await mountAuthStatusPill('/note/o/demo123')

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('登录是能力升级')
    expect(wrapper.text()).toContain('会回到当前上下文')

    ;(trigger.element as HTMLButtonElement).focus()

    await wrapper.get('[data-testid="sso-confirm-cancel"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/note/o/demo123')
    expect(wrapper.find('[data-testid="sso-confirm-modal"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('starts the SSO upgrade flow from keyboard confirmation with the current route as return-to', async () => {
    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    await wrapper.get('[data-testid="auth-status-pill-trigger"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="sso-confirm-action"]').trigger('keydown.enter')
    await flushPromises()

    expect(createAuthLoginUrlMock).toHaveBeenCalledWith('/note/o/demo123', null)
    expect(redirectToLoginMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/login?returnTo=%2Fnote%2Fo%2Fdemo123'
    )
  })

  it('traps keyboard focus inside the modal while it is open', async () => {
    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    await wrapper.get('[data-testid="auth-status-pill-trigger"]').trigger('click')
    await flushPromises()

    const panel = wrapper.get('[role="dialog"]')
    const cancelButton = wrapper.get('[data-testid="sso-confirm-cancel"]')
    const confirmButton = wrapper.get('[data-testid="sso-confirm-action"]')

    expect(document.activeElement).toBe(panel.element)

    await panel.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(cancelButton.element)

    await confirmButton.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(cancelButton.element)

    await cancelButton.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(confirmButton.element)
  })

  it('opens the user center for authenticated users and navigates to a created note from the modal', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { router, wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.update({
      data: {
        items: [
          {
            sid: 'owned123',
            preview: '我创建的第一条便签',
            updatedAt: '2026-04-07T10:00:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      },
      loading: false
    })

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('个人中心')
    expect(meNotesRequestHarness.getLastArg()).toEqual({
      query: {
        page: 1,
        limit: 20
      },
      cacheScope: 'user:1001'
    })

    await wrapper.get('[data-testid="user-center-open-note-owned123"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/note/o/owned123')
    expect(document.activeElement).not.toBe(trigger.element)
  })

  it('reopens the user center on 我的创建 after visiting favorites', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.updateForScope('user:1001', {
      data: {
        items: [
          {
            sid: 'owned123',
            preview: '我创建的第一条便签',
            updatedAt: '2026-04-07T10:00:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      },
      loading: false
    })

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="user-center-tab-favorites"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('我的收藏稍后接入')

    const closeButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text() === '关闭个人中心')
    expect(closeButton).toBeDefined()
    await closeButton!.trigger('click')
    await flushPromises()

    await trigger.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('owned123')
    expect(wrapper.text()).not.toContain('我的收藏稍后接入')
  })

  it('returns focus to the trigger when the user center closes without navigation', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.updateForScope('user:1001', {
      data: {
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      },
      loading: false
    })

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()

    const closeButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text() === '关闭个人中心')
    expect(closeButton).toBeDefined()

    ;(closeButton!.element as HTMLButtonElement).focus()
    await closeButton!.trigger('click')
    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(document.activeElement).toBe(trigger.element)
  })

  it('clears created notes when the authenticated user changes', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { pinia, wrapper } = await mountAuthStatusPill('/note/o/demo123')
    const authStore = useAuthStore(pinia)

    meNotesRequestHarness.updateForScope('user:1001', {
      data: {
        items: [
          {
            sid: 'owned123',
            preview: '我创建的第一条便签',
            updatedAt: '2026-04-07T10:00:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false
      },
      loading: false
    })

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('owned123')

    const closeButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text() === '关闭个人中心')
    expect(closeButton).toBeDefined()
    await closeButton!.trigger('click')
    await flushPromises()

    authStore.setAuthenticated({
      status: 'authenticated',
      user: {
        id: '2002',
        displayName: 'Second User'
      }
    })
    await flushPromises()

    await trigger.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('owned123')
    expect(meNotesRequestHarness.getLastArg()).toEqual({
      query: {
        page: 1,
        limit: 20
      },
      cacheScope: 'user:2002'
    })
  })

  it('navigates to the home route from the empty-state CTA without forcing focus back to the trigger', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { router, wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.updateForScope('user:1001', {
      data: {
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      },
      loading: false
    })

    const trigger = wrapper.get('[data-testid="auth-status-pill-trigger"]')
    await trigger.trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="user-center-create-first-note"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(document.activeElement).not.toBe(trigger.element)
  })

  it('shows an inline error instead of an empty state for malformed my-notes payloads', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.updateForScope('user:1001', {
      data: {
        invalid: true
      },
      loading: false
    })

    await wrapper.get('[data-testid="auth-status-pill-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('暂时无法读取我的创建')
    expect(wrapper.text()).toContain('读取我的创建失败，请稍后重试。')
    expect(wrapper.text()).not.toContain('你还没有创建过在线便签')
  })

  it('downgrades to anonymous when my-notes returns 401 for a stale authenticated session', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { pinia, wrapper } = await mountAuthStatusPill('/note/o/demo123')
    const authStore = useAuthStore(pinia)

    meNotesRequestHarness.updateForScope('user:1001', {
      error: {
        response: {
          status: 401,
          data: {
            message: '查看我的创建前请先完成登录。'
          }
        }
      },
      loading: false
    })

    await wrapper.get('[data-testid="auth-status-pill-trigger"]').trigger('click')
    await flushPromises()

    expect(authStore.status).toBe('anonymous')
    expect(wrapper.find('[data-testid="user-center-modal"]').exists()).toBe(false)
  })

  it('loads the next page of created notes when the user requests more', async () => {
    fetchSessionMock.mockResolvedValueOnce({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })

    const { wrapper } = await mountAuthStatusPill('/note/o/demo123')

    meNotesRequestHarness.updateForRequest('user:1001', 1, 20, {
      data: {
        items: [
          {
            sid: 'owned123',
            preview: '第一页便签',
            updatedAt: '2026-04-07T10:00:00.000Z'
          }
        ],
        page: 1,
        limit: 20,
        total: 21,
        hasMore: true
      },
      loading: false
    })
    meNotesRequestHarness.updateForRequest('user:1001', 2, 20, {
      data: {
        items: [
          {
            sid: 'older456',
            preview: '第二页便签',
            updatedAt: '2025-12-31T23:45:00.000Z'
          }
        ],
        page: 2,
        limit: 20,
        total: 21,
        hasMore: false
      },
      loading: false
    })

    await wrapper.get('[data-testid="auth-status-pill-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('当前已显示 1 / 21 条创建记录')

    await wrapper.get('[data-testid="user-center-load-more"]').trigger('click')
    await flushPromises()

    expect(meNotesRequestHarness.getLastArg()).toEqual({
      query: {
        page: 2,
        limit: 20
      },
      cacheScope: 'user:1001'
    })
    expect(wrapper.text()).toContain('older456')
    expect(wrapper.text()).toContain('当前页为第 2 页')
  })
})
