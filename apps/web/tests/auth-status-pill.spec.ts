// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

const createAuthLoginUrlMock = vi.hoisted(() =>
  vi.fn((returnTo: string) => `http://localhost:3001/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
)
const redirectToLoginMock = vi.hoisted(() => vi.fn())
const fetchSessionMock = vi.hoisted(() => vi.fn(async () => ({ status: 'anonymous' as const })))

vi.mock('../src/services/auth-methods', () => ({
  completeAuthCallback: vi.fn(),
  createAuthLoginUrl: createAuthLoginUrlMock,
  fetchSession: fetchSessionMock,
  redirectToLogin: redirectToLoginMock
}))

import AuthStatusPill from '../src/components/layout/AuthStatusPill.vue'
import { createAppRouter } from '../src/router'

async function mountAuthStatusPill(path = '/note/o/demo123') {
  const router = createAppRouter({
    history: createMemoryHistory()
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(AuthStatusPill, {
    attachTo: document.body,
    global: {
      plugins: [createPinia(), router]
    }
  })

  await flushPromises()

  return {
    router,
    wrapper
  }
}

describe('auth status pill', () => {
  beforeEach(() => {
    createAuthLoginUrlMock.mockClear()
    redirectToLoginMock.mockClear()
    fetchSessionMock.mockClear()
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
})
